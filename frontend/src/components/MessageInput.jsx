import { useState, useRef } from "react";

// Enhanced emoji picker component
const EmojiPicker = ({ onEmojiSelect, onClose }) => {
  const emojis = [
    '😀', '😂', '😊', '😍', '🥰', '😎', '😭', '😴', '😡', '🤔',
    '👍', '👎', '❤️', '💯', '🔥', '💪', '🙌', '👏', '🎉', '🎊',
    '✨', '⭐', '🌟', '💫', '☀️', '🌙', '⚡', '🔔', '💬', '💭'
  ];
  
  return (
    <div className="emoji-picker">
      <div className="emoji-header">
        <span>Choose an emoji</span>
        <button onClick={onClose} className="close-emoji">✕</button>
      </div>
      <div className="emoji-grid">
        {emojis.map(emoji => (
          <button key={emoji} onClick={() => onEmojiSelect(emoji)} className="emoji-btn">
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

function MessageInput({ onSend, disabled, placeholder = "Type a message..." }) {
  const [text, setText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const handleSend = () => {
    if ((!text.trim() && !selectedFile) || disabled) return;
    
    if (selectedFile) {
      onSend(text.trim() || `📎 ${selectedFile.name}`, 'file', selectedFile);
      setSelectedFile(null);
    } else {
      onSend(text.trim());
    }
    setText("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setText(`📎 ${file.name}`);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setText("");
  };

  const handleEmojiSelect = (emoji) => {
    setText(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          const audioFile = new File([audioBlob], 'voice-message.wav', { type: 'audio/wav' });
          onSend('🎤 Voice message', 'audio', audioFile);
          
          // Clean up
          stream.getTracks().forEach(track => track.stop());
          audioChunksRef.current = [];
        };

        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start();
        setIsRecording(true);
      } catch (error) {
        console.error('Error accessing microphone:', error);
        alert('Could not access microphone. Please check permissions.');
      }
    }
  };

  return (
    <div className="chat-input">
      {selectedFile && (
        <div className="file-preview">
          <div className="file-info">
            <span className="file-icon">📎</span>
            <span className="file-name">{selectedFile.name}</span>
            <button onClick={removeFile} className="remove-file">✕</button>
          </div>
        </div>
      )}
      
      {showEmojiPicker && (
        <EmojiPicker 
          onEmojiSelect={handleEmojiSelect}
          onClose={() => setShowEmojiPicker(false)}
        />
      )}
      
      <div className="input-row">
        <div className="input-actions left">
          <button
            className="action-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Attach file"
            disabled={disabled}
          >
            📎
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            hidden
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
            onChange={handleFileUpload}
          />
        </div>
        
        <div className="input-container">
          <textarea
            placeholder={placeholder}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            rows={1}
            className="message-textarea"
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
            }}
          />
          
          <button
            className="emoji-toggle"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            title="Add emoji"
            disabled={disabled}
          >
            😊
          </button>
        </div>

        <div className="input-actions right">
          {text.trim() || selectedFile ? (
            <button 
              className="send-btn" 
              onClick={handleSend}
              disabled={disabled}
              title="Send message"
            >
              ➤
            </button>
          ) : (
            <button
              className={`voice-btn ${isRecording ? 'recording' : ''}`}
              onClick={toggleRecording}
              disabled={disabled}
              title={isRecording ? "Stop recording" : "Record voice message"}
            >
              {isRecording ? "⏹️" : "🎤"}
            </button>
          )}
        </div>
      </div>
      
      {isRecording && (
        <div className="recording-indicator">
          <div className="recording-animation">
            <div className="pulse"></div>
          </div>
          <span>Recording... Tap to stop</span>
        </div>
      )}
    </div>
  );
}

export default MessageInput;