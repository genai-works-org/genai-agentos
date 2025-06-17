import { environment } from '../common/environment';
import { tokenService } from './apiService';
import { authService } from './authService';
// Message types
export interface UserMessage {
  message: string;
}

export interface AgentResponse {
  type: 'agent_response' | 'agent_log';
  response: {
    execution_time: number;
    response: {
      agents_trace: Array<{
        name: string;
        input: {
          content: string;
          additional_kwargs: Record<string, any>;
          response_metadata: Record<string, any>;
          type: string;
          name: string | null;
          id: string;
          example: boolean;
          tool_call_id?: string;
          artifact?: any;
          status?: string;
        };
        output: {
          content: string;
          additional_kwargs: {
            tool_calls?: Array<{
              id: string;
              function: {
                arguments: string;
                name: string;
              };
              type: string;
            }>;
            refusal: any;
          };
          response_metadata: {
            token_usage: {
              completion_tokens: number;
              prompt_tokens: number;
              total_tokens: number;
              completion_tokens_details: {
                accepted_prediction_tokens: number;
                audio_tokens: number;
                reasoning_tokens: number;
                rejected_prediction_tokens: number;
              };
              prompt_tokens_details: {
                audio_tokens: number;
                cached_tokens: number;
              };
            };
            model_name: string;
            system_fingerprint: string;
            id: string;
            prompt_filter_results: Array<{
              prompt_index: number;
              content_filter_results: Record<string, any>;
            }>;
            finish_reason: string;
            logprobs: any;
            content_filter_results: Record<string, any>;
          };
          type: string;
          name: string | null;
          id: string;
          example: boolean;
          tool_calls?: Array<{
            name: string;
            args: Record<string, any>;
            id: string;
            type: string;
          }>;
          invalid_tool_calls: any[];
          usage_metadata: {
            input_tokens: number;
            output_tokens: number;
            total_tokens: number;
            input_token_details: {
              audio: number;
              cache_read: number;
            };
            output_token_details: {
              audio: number;
              reasoning: number;
            };
          };
        };
        is_success: boolean;
        id?: string;
      }>;
      response: string;
      is_success: boolean;
    };
    request_id: string;
    session_id: string;
    files: Array<{
      id: string;
      session_id: string;
      request_id: string;
      original_name: string;
      mimetype: string;
      internal_id: string;
      internal_name: string;
      from_agent: boolean;
    }>;
  };
}

export interface AgentPlan {
  id: string;
  type: string;
  agents: SubAgent[];
  input_params: {
    name: string;
    description: string;
  };
}

export interface SubAgent {
  id: string;
  type: string;
  input_params: {
    name: string;
    description: string;
  };
}

type MessageHandler = (message: AgentResponse) => void;
type ConnectionStateHandler = (isConnected: boolean) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private connectionStateHandlers: Set<ConnectionStateHandler> = new Set();
  // private reconnectAttempts = 0;
  // private maxReconnectAttempts = 5;
  // private reconnectTimeout = 1000;

  constructor() {
    // Remove automatic connection
  }

  // public connect(sessionId?: string): void {
  //   // Check if user is authenticated
  //   const token = tokenService.getToken();
  //   if (!token) {
  //     console.error('Cannot connect: User is not authenticated');
  //     return;
  //   }

  //   // If socket exists and is in OPEN state, reuse it
  //   if (this.socket?.readyState === WebSocket.OPEN) {
  //     console.log('Reusing existing WebSocket connection');
  //     return;
  //   }

  //   // If socket exists but is not in OPEN state, close it first
  //   if (this.socket) {
  //     console.log(
  //       'Closing existing WebSocket connection before creating new one',
  //     );
  //     this.socket.close();
  //     this.socket = null;
  //   }

  //   console.log('Creating new WebSocket connection');

  //   this.attemptConnection(sessionId);
  // }

  public connect(sessionId?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const token = tokenService.getToken();
      if (!token) {
        reject('Cannot connect: User is not authenticated');
        return;
      }

      if (this.socket?.readyState === WebSocket.OPEN) {
        console.log('Reusing existing WebSocket connection');
        resolve();
        return;
      }

      if (this.socket) {
        this.socket.close();
        this.socket = null;
      }

      const url = sessionId
        ? `${this.getWebSocketUrl()}?token=${token}&session_id=${sessionId}`
        : `${this.getWebSocketUrl()}?token=${token}`;

      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        // this.reconnectAttempts = 0;
        this.notifyConnectionState(true);
        resolve();
      };

      this.socket.onmessage = event => {
        try {
          const message = JSON.parse(event.data);
          this.notifyMessageHandlers(message);
        } catch {
          // console.error('Failed to parse WebSocket message:', event.data);
        }
      };

      this.socket.onclose = () => {
        this.notifyConnectionState(false);
      };

      this.socket.onerror = error => {
        console.error('WebSocket error:', error);

        if (this.socket?.readyState !== WebSocket.OPEN) {
          this.socket?.close();
          authService.logout();
        }

        reject(error);
      };
    });
  }

  // private attemptConnection(sessionId?: string): void {
  //   try {
  //     const token = tokenService.getToken();
  //     const url = sessionId
  //       ? `${this.getWebSocketUrl()}?token=${token}&session_id=${sessionId}`
  //       : `${this.getWebSocketUrl()}?token=${token}`;

  //     this.socket = new WebSocket(url);

  //     this.socket.onopen = () => {
  //       this.reconnectAttempts = 0;
  //       this.notifyConnectionState(true);
  //     };

  //     this.socket.onmessage = event => {
  //       try {
  //         const message = JSON.parse(event.data);
  //         this.notifyMessageHandlers(message);
  //       } catch (error) {
  //         // console.error('Error parsing WebSocket message:', error);
  //       }
  //     };

  //     this.socket.onclose = () => {
  //       this.notifyConnectionState(false);
  //       this.handleReconnect();
  //     };

  //     this.socket.onerror = error => {
  //       // console.error('WebSocket error:', error);
  //     };
  //   } catch (error) {
  //     // console.error('Error creating WebSocket connection:', error);
  //     this.handleReconnect();
  //   }
  // }

  private getWebSocketUrl(): string {
    // const token = tokenService.getToken();
    // const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const baseUrl = environment.wsBaseUrl;
    return `${baseUrl}/frontend/ws`;
  }

  // private handleReconnect(): void {
  //   if (this.reconnectAttempts < this.maxReconnectAttempts) {
  //     this.reconnectAttempts++;
  //     setTimeout(() => {
  //       this.connect();
  //     }, this.reconnectTimeout * this.reconnectAttempts);
  //   }
  // }

  public sendMessage(message: UserMessage): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    }
  }

  public addMessageHandler(handler: MessageHandler): void {
    this.messageHandlers.add(handler);
  }

  public removeMessageHandler(handler: MessageHandler): void {
    this.messageHandlers.delete(handler);
  }

  public addConnectionStateHandler(handler: ConnectionStateHandler): void {
    this.connectionStateHandlers.add(handler);
  }

  public removeConnectionStateHandler(handler: ConnectionStateHandler): void {
    this.connectionStateHandlers.delete(handler);
  }

  private notifyMessageHandlers(message: AgentResponse): void {
    this.messageHandlers.forEach(handler => handler(message));
  }

  private notifyConnectionState(isConnected: boolean): void {
    this.connectionStateHandlers.forEach(handler => handler(isConnected));
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

export const websocketService = new WebSocketService();
