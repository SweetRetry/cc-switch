//! 出站 HTTP 客户端
//!
//! 所有需要发送 HTTP 请求的模块都应使用此模块提供的客户端。
//! 客户端跟随系统代理（环境变量），对本机地址一律直连。

use once_cell::sync::OnceCell;
use reqwest::Client;
use std::net::IpAddr;
use std::time::Duration;

/// 跟随系统代理的客户端
static GLOBAL_CLIENT: OnceCell<Client> = OnceCell::new();

/// 不走任何代理的客户端：上游是本机地址（Ollama、LM Studio 等）时使用
static DIRECT_CLIENT: OnceCell<Client> = OnceCell::new();

/// 获取全局 HTTP 客户端
pub fn get() -> Client {
    GLOBAL_CLIENT
        .get_or_init(|| {
            base_builder().build().unwrap_or_else(|e| {
                log::warn!("Failed to build HTTP client: {e}");
                Client::new()
            })
        })
        .clone()
}

/// 按目标地址取客户端：本机地址直连，其余同 [`get`]
///
/// reqwest 跟随系统代理时只认 `NO_PROXY` 环境变量（macOS 不读「不使用代理的主机」），
/// 本机推理服务因此会被送进代理，代理不能代连本机时请求就失败。
pub fn get_for_url(url: &str) -> Client {
    if is_loopback_url(url) {
        direct_client()
    } else {
        get()
    }
}

fn direct_client() -> Client {
    DIRECT_CLIENT
        .get_or_init(|| {
            base_builder().no_proxy().build().unwrap_or_else(|e| {
                log::warn!("Failed to build direct client: {e}");
                Client::new()
            })
        })
        .clone()
}

/// 地址的主机是不是本机：`localhost`、`*.localhost`、`127.0.0.0/8`、`::1`
pub fn is_loopback_url(url: &str) -> bool {
    let Ok(parsed) = url::Url::parse(url.trim()) else {
        return false;
    };
    match parsed.host() {
        Some(url::Host::Domain(domain)) => host_is_loopback(domain),
        Some(url::Host::Ipv4(ip)) => ip.is_loopback(),
        Some(url::Host::Ipv6(ip)) => {
            ip.is_loopback() || ip.to_ipv4_mapped().is_some_and(|v4| v4.is_loopback())
        }
        None => false,
    }
}

fn host_is_loopback(host: &str) -> bool {
    let host = host.trim_end_matches('.');
    if host.eq_ignore_ascii_case("localhost") || host.to_ascii_lowercase().ends_with(".localhost") {
        return true;
    }
    host.trim_start_matches('[')
        .trim_end_matches(']')
        .parse::<IpAddr>()
        .map(|ip| ip.is_loopback())
        .unwrap_or(false)
}

/// 两种客户端共用的参数
fn base_builder() -> reqwest::ClientBuilder {
    Client::builder()
        .timeout(Duration::from_secs(600))
        .connect_timeout(Duration::from_secs(30))
        .pool_max_idle_per_host(10)
        .tcp_keepalive(Duration::from_secs(60))
        // 禁用 reqwest 自动解压：不让它覆盖调用方设置的 accept-encoding。
        .no_gzip()
        .no_brotli()
        .no_deflate()
        .no_zstd()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_is_loopback_url() {
        for url in [
            "http://localhost:11434",
            "http://LOCALHOST",
            "http://localhost./v1",
            "http://127.0.0.1:1234/v1",
            "http://127.1.2.3",
            "http://[::1]:8000",
            "http://[::ffff:127.0.0.1]:8000",
            "http://foo.localhost",
            "https://Api.LocalHost:8443/v1",
        ] {
            assert!(is_loopback_url(url), "{url} should be loopback");
        }
        for url in [
            "http://192.168.1.10:11434",
            "http://10.0.0.2",
            "https://example.com",
            "https://localhost.evil.com",
            "https://evillocalhost",
            "http://[::2]",
            "localhost:11434",
            "",
        ] {
            assert!(!is_loopback_url(url), "{url} should not be loopback");
        }
    }

    /// 起一个只回 200 的一次性本机 HTTP 服务，返回它的地址
    fn spawn_ok_server() -> String {
        use std::io::{Read, Write};
        let listener = std::net::TcpListener::bind("127.0.0.1:0").unwrap();
        let addr = listener.local_addr().unwrap();
        std::thread::spawn(move || {
            for stream in listener.incoming().take(4) {
                let Ok(mut stream) = stream else { continue };
                let mut buf = [0u8; 1024];
                let _ = stream.read(&mut buf);
                let _ = stream.write_all(
                    b"HTTP/1.1 200 OK\r\nContent-Length: 2\r\nConnection: close\r\n\r\nok",
                );
            }
        });
        format!("http://{addr}/v1/models")
    }

    #[tokio::test]
    async fn test_loopback_target_uses_direct_client() {
        let url = spawn_ok_server();
        assert!(is_loopback_url(&url));
        let resp = get_for_url(&url)
            .get(&url)
            .timeout(Duration::from_secs(5))
            .send()
            .await
            .expect("direct client should reach the local server");
        assert_eq!(resp.status().as_u16(), 200);
    }
}
