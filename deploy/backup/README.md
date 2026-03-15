# PostgreSQL Backup and Restore

## 1. Prepare backup env

```bash
cp deploy/backup/.env.backup.example deploy/backup/.env.backup
```

## 2. Run backup

```bash
bash deploy/backup/backup-postgres.sh
```

This script will:
- read DB credentials from backend/.env.production
- create a compressed pg_dump custom-format file
- remove old dump files beyond retention days

## 3. Restore backup

```bash
bash deploy/backup/restore-postgres.sh /var/backups/thongthai/postgres/thongthai_space_YYYYMMDD_HHMMSS.dump
```

## 4. Suggested cron (Linux)

Daily backup at 02:00:

```cron
0 2 * * * cd /opt/thongthai && bash deploy/backup/backup-postgres.sh >> /var/log/thongthai-db-backup.log 2>&1
```
