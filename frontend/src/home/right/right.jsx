import React, { useState, useCallback } from 'react'
import Chatuser from './chatuser'
import Messages from './messages'
import Type from './type'
import AICopilot from './AICopilot'
import useAuth from '../../context/useAuth'
import useTheme from '../../context/useTheme'
import { IoArrowBack } from 'react-icons/io5'

function Right({ onBack }) {
  const { selectedUser } = useAuth();
  const { isDark } = useTheme();
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastMessage, setLastMessage] = useState(null);
  const [suggestionText, setSuggestionText] = useState("");
  const [allMessages, setAllMessages] = useState([]);
  const [triggerSummarize, setTriggerSummarize] = useState(0);

  const handleMessageSent = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const handleLastMessage = useCallback((message) => {
    setLastMessage(message);
  }, []);

  const handleMessagesUpdate = useCallback((messages) => {
    setAllMessages(messages);
  }, []);

  const handleSuggestionClick = useCallback((suggestion) => {
    setSuggestionText(suggestion);
  }, []);

  if (!selectedUser) {
    return (
      <div className={`flex-1 h-screen flex flex-col items-center justify-center
        transition-colors duration-300
        ${isDark ? 'bg-[#0f0f1a]' : 'bg-[#f0f4ff]'}`}>
        <h2 className={`text-lg font-semibold
          ${isDark ? 'text-white' : 'text-gray-800'}`}>
          Welcome to ConnectHub
        </h2>
        <p className={`text-sm mt-1
          ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          Select someone to start chatting
        </p>
      </div>
    );
  }

  return (
    <div className={`flex-1 h-screen flex flex-col transition-colors duration-300
      ${isDark ? 'bg-[#0f0f1a]' : 'bg-[#f0f4ff]'}`}>

      <div className="flex items-center gap-2 md:hidden px-4 pt-3">
        <button
          onClick={onBack}
          className={`transition-colors
            ${isDark
              ? 'text-gray-400 hover:text-white'
              : 'text-gray-500 hover:text-gray-800'}`}
        >
          <IoArrowBack size={22} />
        </button>
      </div>

      <Chatuser />

      <div className={`px-4 py-1.5 flex justify-end border-b transition-colors duration-300
        ${isDark ? 'border-[#1e1e3a] bg-[#0f0f1a]' : 'border-[#c7d2fe] bg-[#f0f4ff]'}`}>
        <button
          onClick={() => setTriggerSummarize(prev => prev + 1)}
          className={`text-[11px] px-3 py-1 rounded-full border transition-all duration-200
            ${isDark
              ? 'border-violet-500/30 text-violet-400 hover:bg-violet-600/10'
              : 'border-indigo-400/40 text-indigo-500 hover:bg-indigo-50'}`}
        >
          Summarize Chat
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        <Messages
          refreshKey={refreshKey}
          onLastMessage={handleLastMessage}
          onMessagesUpdate={handleMessagesUpdate}
        />
      </div>

      <AICopilot
        messages={allMessages}
        lastMessage={lastMessage}
        onSuggestionClick={handleSuggestionClick}
        triggerSummarize={triggerSummarize}
        otherUserName={selectedUser?.fullName}
      />

      <div className={`px-4 py-4 border-t transition-colors duration-300
        ${isDark
          ? 'border-[#1e1e3a] bg-[#0f0f1a]'
          : 'border-[#c7d2fe] bg-[#f0f4ff]'}`}>
        <Type
          onMessageSent={handleMessageSent}
          suggestionText={suggestionText}
          onSuggestionUsed={() => setSuggestionText("")}
        />
      </div>
    </div>
  );
}

export default Right;