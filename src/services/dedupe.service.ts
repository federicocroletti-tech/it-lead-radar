import fs from "node:fs/promises";
import path from "node:path";
import { LeadPost } from "../models/lead-post";

interface NotifiedEntry {
  key: string;
  notifiedAt: string;
  title: string;
  url: string;
}

export class DedupeService {
  private readonly dataFilePath: string;
  private notified: NotifiedEntry[] = [];
  private keys = new Set<string>();
  private initialized = false;

  constructor(
    dataFilePath = path.resolve(process.cwd(), "data", "notified-posts.json"),
  ) {
    this.dataFilePath = dataFilePath;
  }

  private buildKey(post: Pick<LeadPost, "source" | "sourceId">): string {
    return `${post.source}:${post.sourceId}`;
  }

  async init(): Promise<void> {
    if (this.initialized) {
      return;
    }

    await fs.mkdir(path.dirname(this.dataFilePath), { recursive: true });

    try {
      const raw = await fs.readFile(this.dataFilePath, "utf-8");
      const parsed = JSON.parse(raw) as NotifiedEntry[];
      this.notified = Array.isArray(parsed) ? parsed : [];
    } catch {
      this.notified = [];
      await fs.writeFile(
        this.dataFilePath,
        JSON.stringify(this.notified, null, 2),
        "utf-8",
      );
    }

    this.keys = new Set(this.notified.map((entry) => entry.key));
    this.initialized = true;
  }

  async hasBeenNotified(post: LeadPost): Promise<boolean> {
    await this.init();
    return this.keys.has(this.buildKey(post));
  }

  async markAsNotified(post: LeadPost): Promise<void> {
    await this.init();
    const key = this.buildKey(post);

    if (this.keys.has(key)) {
      return;
    }

    const entry: NotifiedEntry = {
      key,
      notifiedAt: new Date().toISOString(),
      title: post.title,
      url: post.url,
    };

    this.notified.push(entry);
    this.keys.add(key);
    await fs.writeFile(
      this.dataFilePath,
      JSON.stringify(this.notified, null, 2),
      "utf-8",
    );
  }
}
