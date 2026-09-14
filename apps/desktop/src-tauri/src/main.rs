#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri_plugin_sql::{Migration, MigrationKind};

fn main() {
  let migrations = vec![Migration {
    version: 1,
    description: "create_secure_kv",
    sql: "CREATE TABLE IF NOT EXISTS secure_kv (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL, updated_at TEXT NOT NULL);",
    kind: MigrationKind::Up,
  }];

  tauri::Builder::default()
    .plugin(
      tauri_plugin_sql::Builder::default()
        .add_migrations("sqlite:sgj.db", migrations)
        .build(),
    )
    .run(tauri::generate_context!())
    .expect("erro ao iniciar o SGJ Desktop");
}
