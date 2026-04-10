import { useState, useEffect } from 'react';
import VapiModule from '@vapi-ai/web';
import './App.css';

import Header from './components/Header';
import Footer from './components/Footer';
import CapabilityChips from './components/CapabilityChips';
import VoiceCard from './components/VoiceCard';
import EscalationForm from './components/EscalationForm';

// Replace YOUR_PUBLIC_KEY with the provided public key from VAPI
const VAPI_PUBLIC_KEY = import.meta.env.VITE_VAPI_PUBLIC_KEY;
const VAPI_ASSISTANT_ID = import.meta.env.VITE_VAPI_ASSISTANT_ID; // Or configure the assistant object directly

// Fallback for Vite CommonJS interop
const Vapi = VapiModule.default || VapiModule.Vapi || VapiModule;

// Initialize Vapi instance
const vapi = new Vapi(VAPI_PUBLIC_KEY);

function App() {
  const [callState, setCallState] = useState('idle'); // 'idle' | 'connecting' | 'listening' | 'speaking' | 'error'
  const [transcript, setTranscript] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);
  const [needsEscalation, setNeedsEscalation] = useState(false);

  useEffect(() => {
    // VAPI Event Listeners
    vapi.on('call-start', () => {
      setCallState('listening');
      setErrorMsg(null);
    });

    vapi.on('call-end', () => {
      setCallState('idle');
    });

    vapi.on('speech-start', () => {
      // Determines whether the assistant or the user started speaking.
      // Based on typical implementation we map: Assistant speaks -> speaking. 
      // Vapi triggers speech-start usually for assistant. For more robust mapping, check message events.
    });

    vapi.on('speech-end', () => {
      setCallState('listening');
    });

    const handleMessage = (message) => {
      // Map messages to transcript and state
      if (message.type === 'transcript') {
        if (message.transcriptType === 'final') {
          setTranscript(prev => [...prev, { role: message.role, text: message.transcript }]);
        }
      }

      // Update speaking states based on message type
      if (message.type === 'speech-update') {
        setCallState(message.role === 'assistant' ? 'speaking' : 'listening');
      }

      // Check for function calls (e.g. escalation)
      if (message.type === 'function-call' && message.functionCall.name === 'escalateToHuman') {
        setNeedsEscalation(true);
        // End the call gracefully so the user can fill the form
        handleEndCall();
      }
    };

    vapi.on('message', handleMessage);

    vapi.on('error', (e) => {
      setCallState('error');
      setErrorMsg(e.message || 'An unexpected error occurred during the call.');
      console.error(e);
    });

    return () => {
      vapi.off('message', handleMessage);
      vapi.removeAllListeners();
    };
  }, []);

  const handleStartCall = async () => {
    try {
      if (!VAPI_PUBLIC_KEY || VAPI_PUBLIC_KEY === import.meta.env.VAPI_PUBLIC_KEY) {
        setErrorMsg('System configuration error: Missing Public Key.');
        setCallState('error');
        return;
      }
      setCallState('connecting');
      setTranscript([]);
      setErrorMsg(null);
      setNeedsEscalation(false);

      // We pass the assistant ID to start. 
      // If none is provided, users usually pass a full assistant object.
      await vapi.start(VAPI_ASSISTANT_ID || {
        model: { provider: 'anthropic', model: 'claude-3-opus-20240229' },
        voice: { provider: '11labs', voiceId: 'burt' }, // standard voice placeholder
        firstMessage: "Hello. You've reached RelayPay secure support. How can I assist you with your operations today?",
        systemPrompt: "You are a professional, calm, and concise financial support system for RelayPay. Never guess. Escalate when needed."
      });
    } catch (e) {
      setCallState('error');
      setErrorMsg(e.message || 'Permissions denied or system unavailable.');
    }
  };

  const handleEndCall = () => {
    vapi.stop();
    setCallState('idle');
  };

  const handleEscalationSubmit = (data) => {
    console.log('Escalation Data Submitted:', data);
    // Success state is now handled locally within VoiceCard
  };

  return (
    <div className="app-container">
      <Header />

      <main className="main-content">
        <VoiceCard
          callState={callState}
          transcript={transcript}
          error={errorMsg}
          onStart={handleStartCall}
          onEnd={handleEndCall}
          showEscalation={needsEscalation}
          onEscalationSubmit={handleEscalationSubmit}
        />
        <CapabilityChips />
      </main>

      <Footer />
    </div>
  );
}

export default App;
