
"use client"
import { useState, useEffect, useRef } from 'react';
import type { Peer } from 'peerjs';
import type { DataConnection } from 'peerjs';

export interface MessagePayload {
    sender: string;
    text: string;
    timestamp: number;
}

export const usePeer = (userId: string | undefined) => {
    const [peerId, setPeerId] = useState<string | null>(null);
    const [messages, setMessages] = useState<MessagePayload[]>([]);
    const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
    
    const peerInstance = useRef<Peer | null>(null);
    const connectionInstance = useRef<DataConnection | null>(null);

    useEffect(() => {
        if (!userId || peerInstance.current) return;

        // Dynamically import PeerJS on the client side
        import('peerjs').then(({ default: Peer }) => {
            const peer = new Peer(userId, {
                // For production, you would configure your own PeerJS server
                // host: 'your-peerjs-server.com',
                // port: 9000,
                // path: '/myapp'
            });
            peerInstance.current = peer;

            peer.on('open', (id) => {
                console.log('My peer ID is: ' + id);
                setPeerId(id);
            });

            peer.on('connection', (conn) => {
                console.log('Incoming connection from', conn.peer);
                connectionInstance.current = conn;
                setConnectionStatus('connected');
                
                conn.on('data', (data) => {
                    setMessages(prev => [...prev, data as MessagePayload]);
                });

                conn.on('close', () => {
                    console.log('Connection closed');
                    setConnectionStatus('disconnected');
                    connectionInstance.current = null;
                });
            });

            peer.on('error', (err) => {
                console.error(err);
                setConnectionStatus('error');
            });
        });

        // Cleanup on component unmount
        return () => {
            if (peerInstance.current) {
                peerInstance.current.destroy();
                peerInstance.current = null;
            }
        };
    }, [userId]);

    const connect = (remotePeerId: string) => {
        if (!peerInstance.current || connectionInstance.current) return;
        
        setConnectionStatus('connecting');
        const conn = peerInstance.current.connect(remotePeerId);
        connectionInstance.current = conn;

        conn.on('open', () => {
            console.log('Connection established to', remotePeerId);
            setConnectionStatus('connected');
        });

        conn.on('data', (data) => {
            setMessages(prev => [...prev, data as MessagePayload]);
        });
        
        conn.on('close', () => {
            console.log('Connection closed');
            setConnectionStatus('disconnected');
            connectionInstance.current = null;
        });

        conn.on('error', (err) => {
            console.error('Connection error:', err);
            setConnectionStatus('error');
        })
    };

    const sendMessage = (text: string) => {
        if (connectionInstance.current && connectionStatus === 'connected' && peerId) {
            const message: MessagePayload = {
                sender: peerId,
                text,
                timestamp: Date.now()
            };
            connectionInstance.current.send(message);
            // Add own message to the chat
            setMessages(prev => [...prev, message]);
        }
    };

    return { peerId, messages, connectionStatus, connect, sendMessage };
};
