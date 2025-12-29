/**
 * Usage Tracker
 * Persists request usage data to a SQLite database.
 * Tracks tokens, models, accounts, and timestamps.
 */

import sqlite3 from 'sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdir } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = join(__dirname, '../data/usage.db');

export class UsageTracker {
    constructor() {
        this.db = null;
        this.initPromise = null;
    }

    async initialize() {
        if (this.initPromise) return this.initPromise;

        this.initPromise = (async () => {
            // Ensure directory exists
            await mkdir(dirname(DB_PATH), { recursive: true });

            return new Promise((resolve, reject) => {
                this.db = new sqlite3.Database(DB_PATH, (err) => {
                    if (err) {
                        console.error('[UsageTracker] Failed to open database:', err);
                        reject(err);
                        return;
                    }
                    console.log('[UsageTracker] Database connected');
                    this.createTable().then(resolve).catch(reject);
                });
            });
        })();

        return this.initPromise;
    }

    createTable() {
        return new Promise((resolve, reject) => {
            const sql = `
                CREATE TABLE IF NOT EXISTS usage_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT NOT NULL,
                    model TEXT NOT NULL,
                    account_email TEXT,
                    input_tokens INTEGER DEFAULT 0,
                    output_tokens INTEGER DEFAULT 0,
                    cache_read_tokens INTEGER DEFAULT 0,
                    cache_creation_tokens INTEGER DEFAULT 0,
                    total_tokens INTEGER DEFAULT 0,
                    status TEXT DEFAULT 'success',
                    error TEXT
                )
            `;
            this.db.run(sql, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    async logRequest(data) {
        try {
            await this.initialize();

            const {
                model,
                accountEmail,
                usage = {},
                status = 'success',
                error = null
            } = data;

            const inputTokens = usage.input_tokens || 0;
            const outputTokens = usage.output_tokens || 0;
            const cacheReadTokens = usage.cache_read_input_tokens || 0;
            const cacheCreationTokens = usage.cache_creation_input_tokens || 0;
            // Antigravity total includes cached tokens, but usually total = input + output
            // Let's store sum as total for simplicity in querying
            const totalTokens = inputTokens + outputTokens + cacheReadTokens + cacheCreationTokens;

            const sql = `
                INSERT INTO usage_logs (
                    timestamp, model, account_email,
                    input_tokens, output_tokens, cache_read_tokens, cache_creation_tokens,
                    total_tokens, status, error
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            return new Promise((resolve, reject) => {
                this.db.run(sql, [
                    new Date().toISOString(),
                    model,
                    accountEmail,
                    inputTokens,
                    outputTokens,
                    cacheReadTokens,
                    cacheCreationTokens,
                    totalTokens,
                    status,
                    error
                ], function(err) {
                    if (err) {
                        console.error('[UsageTracker] Failed to insert log:', err);
                        reject(err);
                    } else {
                        resolve(this.lastID);
                    }
                });
            });
        } catch (err) {
            console.error('[UsageTracker] Error logging request:', err);
        }
    }

    async getHistory(limit = 100) {
        await this.initialize();
        return new Promise((resolve, reject) => {
            this.db.all(
                `SELECT * FROM usage_logs ORDER BY id DESC LIMIT ?`,
                [limit],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }

    async getStats(timeRange = '24h') {
        await this.initialize();
        // Calculate start time based on range
        const now = new Date();
        let startTime;

        if (timeRange === '24h') {
            startTime = new Date(now - 24 * 60 * 60 * 1000);
        } else if (timeRange === '7d') {
            startTime = new Date(now - 7 * 24 * 60 * 60 * 1000);
        } else {
            startTime = new Date(0); // All time
        }

        return new Promise((resolve, reject) => {
            const sql = `
                SELECT
                    model,
                    COUNT(*) as request_count,
                    SUM(input_tokens) as total_input,
                    SUM(output_tokens) as total_output,
                    SUM(cache_read_tokens) as total_cache_read,
                    SUM(total_tokens) as total_all
                FROM usage_logs
                WHERE timestamp >= ?
                GROUP BY model
            `;

            this.db.all(sql, [startTime.toISOString()], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
}

// Singleton instance
export const usageTracker = new UsageTracker();
