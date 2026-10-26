//! 客户端文件的设备本地状态（`live-state.json`）、多文件写入和崩溃恢复。
//! 旧版路由与聚合状态仅用于升级时恢复直连。

pub mod controller;
pub mod current;
pub mod operation;
pub mod state;
