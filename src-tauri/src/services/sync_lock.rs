//! 全库写操作的互斥锁
//!
//! 导入 / 恢复会替换整个数据库，期间其它写入（如提示词落盘）必须让路。

use once_cell::sync::OnceCell;
use tokio::sync::Mutex;

static SYNC_MUTEX: OnceCell<Mutex<()>> = OnceCell::new();

pub(crate) fn sync_mutex() -> &'static Mutex<()> {
    SYNC_MUTEX.get_or_init(|| Mutex::new(()))
}
