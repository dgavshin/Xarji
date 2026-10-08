import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { Database } from "bun:sqlite";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { previewSenders } from "../preview";

/** All previews use explicit paths and synthetic data; never inspect a personal chat.db. */

describe("previewSenders — error paths", () => {
  test("reports messages-db-missing when chat.db path doesn't exist", () => {
    const result = previewSenders(["SOLO"], {
      messagesDbPath: "/definitely/does/not/exist/chat.db",
    });
    expect(result.ok).toBe(false);
    expect(result.errorKind).toBe("messages-db-missing");
    expect(result.banks).toEqual([]);
    expect(result.error).toContain("not found");
  });

  test("never throws on empty sender list (returns empty banks if db exists)", () => {
    // If the running machine happens to have chat.db we get ok:true + []
    // banks; otherwise messages-db-missing. Either way, no throw.
    const result = previewSenders([], {
      messagesDbPath: "/tmp/xarji-unit-test-nonexistent.db",
    });
    expect(typeof result.ok).toBe("boolean");
  });
});

describe("previewSenders — happy path (synthetic Messages database)", () => {
  let fixtureDir: string;
  let chatDbPath: string;
  beforeAll(() => {
    fixtureDir = mkdtempSync(join(tmpdir(), "xarji-preview-test-"));
    chatDbPath = join(fixtureDir, "synthetic-chat.db");
    const db = new Database(chatDbPath, { create: true });
    db.exec("CREATE TABLE handle(id TEXT); CREATE TABLE message(handle_id INTEGER,text TEXT,attributedBody BLOB,date INTEGER); INSERT INTO handle VALUES('TBC SMS');");
    for (let i = 0; i < 4; i++) db.query("INSERT INTO message VALUES(1,?,NULL,?)").run(
      "47.80 GEL\nVISA (***0000)\nSYNTHETIC SHOP\n01/01/2026", 789004800000000000 + i * 1000000000
    );
    db.close();
  });
  afterAll(() => rmSync(fixtureDir, { recursive: true, force: true }));

  test("returns per-bank counts for an unknown sender (0 messages)", () => {
    const result = previewSenders(["__synthetic-unknown-sender__"], { messagesDbPath: chatDbPath });
    expect(result.ok).toBe(true);
    expect(result.banks).toHaveLength(1);
    expect(result.banks[0].messageCount).toBe(0);
    expect(result.banks[0].parsedCount).toBe(0);
    expect(result.banks[0].samples).toEqual([]);
  });

  test("caps samples at sampleLimit with a deterministic fixture", () => {
    const result = previewSenders(["TBC SMS"], { messagesDbPath: chatDbPath, sampleLimit: 3 });
    expect(result.ok).toBe(true);
    expect(result.banks[0].parsedCount).toBe(4);
    expect(result.banks[0].samples).toHaveLength(3);
  });
});
