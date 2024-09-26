// @ts-nocheck
import { EventEmitter } from "events";
import inject from "reconnect-core";

import type { CommunicationMessage } from "./communication";
import { CommunicationType, ConsoleCommunication } from "./communication";
import type { Connection, ConnectionDetails, ConnectionSettings } from "./types";
import { ConnectionEvent, ConnectionStatus, Ports } from "./types";

export const NETWORK_MESSAGE = "HELO\0";

const DEFAULT_CONNECTION_TIMEOUT_MS = 20000;

const defaultConnectionDetails: ConnectionDetails = {
  consoleNick: "unknown",
  gameDataCursor: Uint8Array.from([0, 0, 0, 0, 0, 0, 0, 0]),
  version: "",
  clientToken: 0,
};

const consoleConnectionOptions = {
  autoReconnect: true,
};

export type ConsoleConnectionOptions = typeof consoleConnectionOptions;

/**
 * Responsible for maintaining connection to a Slippi relay connection or Wii connection.
 * Events are emitted whenever data is received.
 *
 * Basic usage example:
 *
 * ```javascript
 * const { ConsoleConnection } = require("@slippi/slippi-js");
 *
 * const connection = new ConsoleConnection();
 * connection.connect("localhost", 667); // You should set these values appropriately
 *
 * connection.on("data", (data) => {
 *   // Received data from console
 *   console.log(data);
 * });
 *
 * connection.on("statusChange", (status) => {
 *   console.log(`status changed: ${status}`);
 * });
 * ```
 */
export class ConsoleConnection extends EventEmitter implements Connection {
  private ipAddress: string;
  private port: number;
  private isRealtime: boolean;
  private connectionStatus = ConnectionStatus.DISCONNECTED;
  private connDetails: ConnectionDetails = { ...defaultConnectionDetails };
  private client: null = null;
  private connection: inject.Instance<unknown, null> | null = null;
  private options: ConsoleConnectionOptions;

  public constructor(options?: Partial<ConsoleConnectionOptions>) {
    super();
    this.ipAddress = "0.0.0.0";
    this.port = Ports.DEFAULT;
    this.isRealtime = false;
    this.options = Object.assign({}, consoleConnectionOptions, options);
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

  /**
   * @returns The specific details about the connected console.
   */
  public getDetails(): ConnectionDetails {
    return { ...this.connDetails };
  }

  /**
   * Initiate a connection to the Wii or Slippi relay.
   * @param ip   The IP address of the Wii or Slippi relay.
   * @param port The port to connect to.
   * @param isRealtime Optional. A flag to tell the Wii to send data as quickly as possible
   * @param timeout Optional. The timeout in milliseconds when attempting to connect
   *                to the Wii or relay.
   */
  public connect(ip: string, port: number, isRealtime = false, timeout = DEFAULT_CONNECTION_TIMEOUT_MS): void {
    this.ipAddress = ip;
    this.port = port;
    this.isRealtime = isRealtime;
    this._connectOnPort(ip, port, timeout);
  }

  private _connectOnPort(ip: string, port: number, timeout: number): void {}

  /**
   * Terminate the current connection.
   */
  public disconnect(): void {
    // Prevent reconnections and disconnect
    if (this.connection) {
      this.connection.reconnect = false;
      this.connection.disconnect();
      this.connection = null;
    }

    if (this.client) {
    }
  }
}
