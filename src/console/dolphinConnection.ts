// @ts-nocheck
import { EventEmitter } from "events";

import type { Connection, ConnectionDetails, ConnectionSettings } from "./types";
import { ConnectionEvent, ConnectionStatus, Ports } from "./types";

const MAX_PEERS = 32;

export enum DolphinMessageType {
  CONNECT_REPLY = "connect_reply",
  GAME_EVENT = "game_event",
  START_GAME = "start_game",
  END_GAME = "end_game",
}

export class DolphinConnection extends EventEmitter implements Connection {
  private ipAddress: string;
  private port: number;
  private connectionStatus = ConnectionStatus.DISCONNECTED;
  private gameCursor = 0;
  private nickname = "unknown";
  private version = "";
  private peer: any | null = null;

  public constructor() {
    super();
    this.ipAddress = "0.0.0.0";
    this.port = Ports.DEFAULT;
  }

  /**
   * @returns The current connection status.
   */
  public getStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  /**
   * @returns The IP address and port of the current connection.
   */
  public getSettings(): ConnectionSettings {
    return {
      ipAddress: this.ipAddress,
      port: this.port,
    };
  }

  public getDetails(): ConnectionDetails {
    return {
      consoleNick: this.nickname,
      gameDataCursor: this.gameCursor,
      version: this.version,
    };
  }

  public async connect(ip: string, port: number): Promise<void> {
    console.log(`Connecting to: ${ip}:${port}`);
    this.ipAddress = ip;
    this.port = port;

    this._setStatus(ConnectionStatus.CONNECTING);
  }

  public disconnect(): void {
    if (this.peer) {
      this.peer.disconnect();
      this.peer = null;
    }
    this._setStatus(ConnectionStatus.DISCONNECTED);
  }

  private _handleReplayData(data: Uint8Array): void {
    this.emit(ConnectionEvent.DATA, data);
  }

  private _setStatus(status: ConnectionStatus): void {
    // Don't fire the event if the status hasn't actually changed
    if (this.connectionStatus !== status) {
      this.connectionStatus = status;
      this.emit(ConnectionEvent.STATUS_CHANGE, this.connectionStatus);
    }
  }

  private _updateCursor(message: { cursor: number; next_cursor: number }, dataString: string): void {
    const { cursor, next_cursor } = message;

    if (this.gameCursor !== cursor) {
      const err = new Error(
        `Unexpected game data cursor. Expected: ${this.gameCursor} but got: ${cursor}. Payload: ${dataString}`,
      );
      console.warn(err);
      this.emit(ConnectionEvent.ERROR, err);
    }

    this.gameCursor = next_cursor;
  }
}
