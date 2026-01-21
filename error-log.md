~/Code/iot-project/frontend$ npm run dev

> frontend@0.1.0 dev
> next dev

⚠ Port 3000 is in use by an unknown process, using available port 3001 instead.
▲ Next.js 16.1.4 (Turbopack)
- Local:         http://localhost:3001
- Network:       http://192.168.0.178:3001

✓ Starting...
✓ Ready in 4.2s

thread 'tokio-runtime-worker' (13080) panicked at /build/turbopack/crates/turbo-tasks-backend/src/backend/operation/mod.rs:156:17:
Failed to restore task data (corrupted database or bug): Data for get_written_endpoint_with_issues_operation (TaskId 251))

Caused by:
    0: Looking up data for TaskId 251 from database failed
    1: Failed to deserialize AMQF from 00000221.meta for 00000216.sst
    2: UnexpectedEnd { additional: 37293 }
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace

-----
FATAL: An unexpected Turbopack error occurred. A panic log has been written to /tmp/next-panic-ee7776f171977a4538b02ef01e3b5fd.log.

To help make Turbopack better, report this error by clicking here.
-----


thread 'tokio-runtime-worker' (13075) panicked at /build/turbopack/crates/turbo-tasks-backend/src/backend/operation/mod.rs:156:17:
Failed to restore task data (corrupted database or bug): Data for get_written_endpoint_with_issues_operation (TaskId 119074))

Caused by:
    0: Looking up data for TaskId 119074 from database failed
    1: Failed to deserialize AMQF from 00000221.meta for 00000216.sst
    2: UnexpectedEnd { additional: 37293 }

thread '<unnamed>' (13061) panicked at /build/turbopack/crates/turbo-tasks-backend/src/backend/operation/mod.rs:156:17:
Failed to restore task data (corrupted database or bug): Data for get_source_map_rope_operation (TaskId 277294))

Caused by:
    0: Looking up data for TaskId 277294 from database failed
    1: Failed to deserialize AMQF from 00000221.meta for 00000216.sst
    2: UnexpectedEnd { additional: 37293 }
⨯ Error [TurbopackInternalError]: Failed to restore task data (corrupted database or bug): Data for get_written_endpoint_with_issues_operation (TaskId 119074))

Debug info:
- Failed to restore task data (corrupted database or bug): Data for get_written_endpoint_with_issues_operation (TaskId 119074))
  
  Caused by:
      0: Looking up data for TaskId 119074 from database failed
      1: Failed to deserialize AMQF from 00000221.meta for 00000216.sst
      2: UnexpectedEnd { additional: 37293 }
    at <unknown> (TurbopackInternalError: Failed to restore task data (corrupted database or bug): Data for get_written_endpoint_with_issues_operation (TaskId 119074))) {
  location: '/build/turbopack/crates/turbo-tasks-backend/src/backend/operation/mod.rs:156:17'
}

thread 'tokio-runtime-worker' (13075) panicked at /build/turbopack/crates/turbo-tasks-backend/src/backend/operation/mod.rs:156:17:
Failed to restore task data (corrupted database or bug): Data for get_written_endpoint_with_issues_operation (TaskId 119074))

Caused by:
    0: Looking up data for TaskId 119074 from database failed
    1: Failed to deserialize AMQF from 00000221.meta for 00000216.sst
    2: UnexpectedEnd { additional: 37293 }

thread '<unnamed>' (13061) panicked at /build/turbopack/crates/turbo-tasks-backend/src/backend/operation/mod.rs:156:17:
Failed to restore task data (corrupted database or bug): Data for get_source_map_rope_operation (TaskId 277295))

Caused by:
    0: Looking up data for TaskId 277295 from database failed
    1: Failed to deserialize AMQF from 00000221.meta for 00000216.sst
    2: UnexpectedEnd { additional: 37293 }
Error [TurbopackInternalError]: Failed to restore task data (corrupted database or bug): Data for get_written_endpoint_with_issues_operation (TaskId 251))

Debug info:
- Failed to restore task data (corrupted database or bug): Data for get_written_endpoint_with_issues_operation (TaskId 251))
  
  Caused by:
      0: Looking up data for TaskId 251 from database failed
      1: Failed to deserialize AMQF from 00000221.meta for 00000216.sst
      2: UnexpectedEnd { additional: 37293 }
    at <unknown> (TurbopackInternalError: Failed to restore task data (corrupted database or bug): Data for get_written_endpoint_with_issues_operation (TaskId 251))) {
  location: '/build/turbopack/crates/turbo-tasks-backend/src/backend/operation/mod.rs:156:17'
}

thread 'tokio-runtime-worker' (13075) panicked at /build/turbopack/crates/turbo-tasks-backend/src/backend/operation/mod.rs:156:17:
Failed to restore task data (corrupted database or bug): Data for get_written_endpoint_with_issues_operation (TaskId 119074))

Caused by:
    0: Looking up data for TaskId 119074 from database failed
    1: Failed to deserialize AMQF from 00000221.meta for 00000216.sst
    2: UnexpectedEnd { additional: 37293 }

thread '<unnamed>' (13061) panicked at /build/turbopack/crates/turbo-tasks-backend/src/backend/operation/mod.rs:156:17:
Failed to restore task data (corrupted database or bug): Data for get_source_map_rope_operation (TaskId 277294))

Caused by:
    0: Looking up data for TaskId 277294 from database failed
    1: Failed to deserialize AMQF from 00000221.meta for 00000216.sst
    2: UnexpectedEnd { additional: 37293 }
⨯ Error [TurbopackInternalError]: Failed to restore task data (corrupted database or bug): Data for get_written_endpoint_with_issues_operation (TaskId 119074))

Debug info:
- Failed to restore task data (corrupted database or bug): Data for get_written_endpoint_with_issues_operation (TaskId 119074))
  
  Caused by:
      0: Looking up data for TaskId 119074 from database failed
      1: Failed to deserialize AMQF from 00000221.meta for 00000216.sst
      2: UnexpectedEnd { additional: 37293 }
    at <unknown> (TurbopackInternalError: Failed to restore task data (corrupted database or bug): Data for get_written_endpoint_with_issues_operation (TaskId 119074))) {
  location: '/build/turbopack/crates/turbo-tasks-backend/src/backend/operation/mod.rs:156:17'
}

thread 'tokio-runtime-worker' (13080) panicked at /build/turbopack/crates/turbo-tasks-backend/src/backend/operation/mod.rs:156:17:
Failed to restore task data (corrupted database or bug): Data for get_written_endpoint_with_issues_operation (TaskId 119074))

Caused by:
    0: Looking up data for TaskId 119074 from database failed
    1: Failed to deserialize AMQF from 00000221.meta for 00000216.sst
    2: UnexpectedEnd { additional: 37293 }

thread '<unnamed>' (13061) panicked at /build/turbopack/crates/turbo-tasks-backend/src/backend/operation/mod.rs:156:17:
Failed to restore task data (corrupted database or bug): Data for get_source_map_rope_operation (TaskId 277294))

Caused by:
    0: Looking up data for TaskId 277294 from database failed
    1: Failed to deserialize AMQF from 00000221.meta for 00000216.sst
    2: UnexpectedEnd { additional: 37293 }
Error [TurbopackInternalError]: Failed to restore task data (corrupted database or bug): Data for get_written_endpoint_with_issues_operation (TaskId 119074))

Debug info:
- Failed to restore task data (corrupted database or bug): Data for get_written_endpoint_with_issues_operation (TaskId 119074))
  
  Caused by:
      0: Looking up data for TaskId 119074 from database failed
      1: Failed to deserialize AMQF from 00000221.meta for 00000216.sst
      2: UnexpectedEnd { additional: 37293 }
    at <unknown> (TurbopackInternalError: Failed to restore task data (corrupted database or bug): Data for get_written_endpoint_with_issues_operation (TaskId 119074))) {
  location: '/build/turbopack/crates/turbo-tasks-backend/src/backend/operation/mod.rs:156:17'
}
