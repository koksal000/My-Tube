
"use client"
import { useState, useEffect, useRef } from 'react';
import type { Peer } from 'peerjs';
import type { DataConnection } from 'peerjs';

export interface MessagePayload {
    sender: string;
    text: string;
    timestamp: number;
}

export type ConnectionStatus = {
    status: 'disconnected' | 'connecting' | 'connected' | 'error';
    peerId?: string;
}

export const usePeer = (userId: string | undefined) => {
    const [peerId, setPeerId] = useState<string | null>(null);
    const [messages, setMessages] = useState<MessagePayload[]>([]);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({status: 'disconnected'});
    
    const peerInstance = useRef<Peer | null>(null);
    const connectionInstance = useRef<DataConnection | null>(null);

    // Function to cleanly close existing connections
    const closeConnection = () => {
        if (connectionInstance.current) {
            connectionInstance.current.close();
        }
        connectionInstance.current = null;
        setConnectionStatus({status: 'disconnected'});
        // Optionally clear messages of the past conversation
        // setMessages([]); 
    };

    useEffect(() => {
        if (!userId || peerInstance.current) return;

        import('peerjs').then(({ default: Peer }) => {
            if (peerInstance.current) {
                peerInstance.current.destroy();
            }
            const peer = new Peer(userId);
            peerInstance.current = peer;

            peer.on('open', (id) => {
                console.log('My peer ID is: ' + id);
                setPeerId(id);
            });

            peer.on('connection', (conn) => {
                console.log('Incoming connection from', conn.peer);
                closeConnection(); // Close any existing connection before accepting a new one
                connectionInstance.current = conn;
                setConnectionStatus({status: 'connected', peerId: conn.peer});
                
                conn.on('data', (data) => {
                    setMessages(prev => [...prev, data as MessagePayload]);
                });

                conn.on('close', () => {
                    console.log('Connection closed');
                    closeConnection();
                });
            });

            peer.on('error', (err) => {
                console.error('PeerJS error:', err);
                setConnectionStatus({status: 'error', peerId: connectionStatus.peerId});
            });
        });

        return () => {
            closeConnection();
            if (peerInstance.current) {
                peerInstance.current.destroy();
                peerInstance.current = null;
            }
        };
    }, [userId]);

    const connect = (remotePeerId: string) => {
        if (!peerInstance.current || !userId) return;
        if (connectionInstance.current?.peer === remotePeerId && connectionStatus.status === 'connected') {
            console.log("Already connected to", remotePeerId);
            return;
        }

        closeConnection(); // Ensure any old connection is closed before starting a new one
        
        console.log(`Attempting to connect to ${remotePeerId}...`);
        setConnectionStatus({status: 'connecting', peerId: remotePeerId});
        
        const conn = peerInstance.current.connect(remotePeerId, { reliable: true });
        connectionInstance.current = conn;

        conn.on('open', () => {
            console.log('Connection established to', remotePeerId);
            setConnectionStatus({status: 'connected', peerId: remotePeerId});
        });

        conn.on('data', (data) => {
            setMessages(prev => [...prev, data as MessagePayload]);
        });
        
        conn.on('close', () => {
            console.log('Connection closed with', remotePeerId);
            closeConnection();
        });

        conn.on('error', (err) => {
            console.error(`Connection error with ${remotePeerId}:`, err);
            setConnectionStatus({status: 'error', peerId: remotePeerId});
            closeConnection();
        })
    };

    const sendMessage = (text: string) => {
        if (connectionInstance.current && connectionStatus.status === 'connected' && peerId) {
            const message: MessagePayload = {
                sender: peerId,
                text,
                timestamp: Date.now()
            };
            connectionInstance.current.send(message);
            setMessages(prev => [...prev, message]);
        }
    };

    return { peerId, messages, connectionStatus, connect, sendMessage };
};