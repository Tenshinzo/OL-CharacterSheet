CREATE TABLE IF NOT EXISTS users (
  id            CHAR(36)      NOT NULL PRIMARY KEY,
  email         VARCHAR(255)  NOT NULL,
  email_verified_at DATETIME  NULL,
  password_hash VARCHAR(255)  NULL,
  display_name  VARCHAR(100)  NOT NULL,
  role          ENUM('user','admin') NOT NULL DEFAULT 'user',
  discord_id    VARCHAR(32)   NULL,
  discord_username VARCHAR(100) NULL,
  disabled_at   DATETIME      NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_discord (discord_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sessions (
  token_hash    CHAR(64)      NOT NULL PRIMARY KEY,
  user_id       CHAR(36)      NOT NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at    DATETIME      NOT NULL,
  user_agent    VARCHAR(255)  NULL,
  KEY ix_sessions_user (user_id),
  KEY ix_sessions_expires (expires_at),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS invites (
  code          VARCHAR(32)   NOT NULL PRIMARY KEY,
  created_by    CHAR(36)      NULL,
  note          VARCHAR(255)  NULL,
  used_by       CHAR(36)      NULL,
  used_at       DATETIME      NULL,
  expires_at    DATETIME      NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_invites_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_invites_user FOREIGN KEY (used_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS email_tokens (
  token_hash    CHAR(64)      NOT NULL PRIMARY KEY,
  user_id       CHAR(36)      NOT NULL,
  purpose       ENUM('verify','reset') NOT NULL,
  expires_at    DATETIME      NOT NULL,
  used_at       DATETIME      NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_email_tokens_user (user_id),
  CONSTRAINT fk_email_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- One row per character. The full character object lives in `data`;
-- the other columns are denormalised for listing and permission checks.
CREATE TABLE IF NOT EXISTS characters (
  id            VARCHAR(64)   NOT NULL PRIMARY KEY,
  owner_id      CHAR(36)      NOT NULL,
  name          VARCHAR(200)  NOT NULL,
  kind          ENUM('primary','alternate_form','companion') NOT NULL DEFAULT 'primary',
  primary_character_id VARCHAR(64) NULL,
  data          JSON          NOT NULL,
  version       INT UNSIGNED  NOT NULL DEFAULT 1,
  created_at    DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  updated_by    CHAR(36)      NULL,
  KEY ix_characters_owner (owner_id),
  KEY ix_characters_primary (primary_character_id),
  CONSTRAINT fk_characters_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Per-user JSON blobs: 'settings', 'customBoons', 'customBanes'
CREATE TABLE IF NOT EXISTS user_data (
  user_id       CHAR(36)      NOT NULL,
  kind          VARCHAR(32)   NOT NULL,
  data          JSON          NOT NULL,
  updated_at    DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (user_id, kind),
  CONSTRAINT fk_user_data_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `groups` (
  id            CHAR(36)      NOT NULL PRIMARY KEY,
  name          VARCHAR(100)  NOT NULL,
  gm_id         CHAR(36)      NOT NULL,
  invite_code   VARCHAR(16)   NOT NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_groups_invite (invite_code),
  KEY ix_groups_gm (gm_id),
  CONSTRAINT fk_groups_gm FOREIGN KEY (gm_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS group_members (
  group_id      CHAR(36)      NOT NULL,
  user_id       CHAR(36)      NOT NULL,
  joined_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (group_id, user_id),
  KEY ix_group_members_user (user_id),
  CONSTRAINT fk_gm_group FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE,
  CONSTRAINT fk_gm_user  FOREIGN KEY (user_id)  REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Characters a member has assigned to a group. Only primary characters are
-- assigned; their alternate forms and companions follow implicitly.
CREATE TABLE IF NOT EXISTS group_characters (
  group_id      CHAR(36)      NOT NULL,
  character_id  VARCHAR(64)   NOT NULL,
  added_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (group_id, character_id),
  KEY ix_group_characters_char (character_id),
  CONSTRAINT fk_gc_group FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE,
  CONSTRAINT fk_gc_char  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
