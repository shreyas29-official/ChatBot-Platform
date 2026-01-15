import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { chatAPI, projectsAPI, filesAPI } from '../services/api';
import { Send, ArrowLeft, Upload, X, Image, Paperclip } from 'lucide-react';

const Chat = () => {
  const { projectId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState(null);
  const [files, setFiles] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchProject();
    fetchMessages();
    fetchFiles();
  }, [projectId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchProject = async () => {
    try {
      const response = await projectsAPI.getById(projectId);
      setProject(response.data);
    } catch (error) {
      console.error('Failed to fetch project:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await chatAPI.getMessages(projectId);
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const fetchFiles = async () => {
    try {
      const response = await filesAPI.getFiles(projectId);
      setFiles(response.data);
    } catch (error) {
      console.error('Failed to fetch files:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedImage) || loading) return;

    const userMessage = { 
      role: 'user', 
      content: newMessage || 'Analyze this image', 
      created_at: new Date() 
    };
    setMessages(prev => [...prev, userMessage]);
    
    const messageToSend = newMessage;
    setNewMessage('');
    
    let imageUrl = null;
    if (selectedImage) {
      // Convert image to base64 data URL
      const reader = new FileReader();
      imageUrl = await new Promise((resolve) => {
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(selectedImage);
      });
      setSelectedImage(null);
      setImagePreview(null);
    }
    
    setLoading(true);

    try {
      const response = await chatAPI.sendMessage(projectId, messageToSend, imageUrl);
      setMessages(prev => [...prev, response.data]);
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.',
        created_at: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      await filesAPI.upload(projectId, file);
      fetchFiles();
    } catch (error) {
      console.error('Failed to upload file:', error);
    }
  };

  const handleDeleteFile = async (fileId) => {
    try {
      await filesAPI.delete(fileId);
      fetchFiles();
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const clearSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const clearChat = async () => {
    if (window.confirm('Are you sure you want to clear the chat history?')) {
      try {
        await chatAPI.clearHistory(projectId);
        setMessages([]);
      } catch (error) {
        console.error('Failed to clear chat:', error);
      }
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-sm border-r">
        <div className="p-4 border-b">
          <Link to="/dashboard" className="flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>
        
        <div className="p-4">
          <h2 className="font-semibold text-gray-900 mb-2">{project?.name}</h2>
          <p className="text-sm text-gray-600 mb-4">{project?.description}</p>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload File
            </label>
            <input
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Upload className="w-4 h-4 mr-2" />
              Choose File
            </label>
          </div>

          {files.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Files</h3>
              <div className="space-y-2">
                {files.map((file) => (
                  <div key={file._id} className="flex items-center justify-between text-sm">
                    <span className="truncate">{file.originalName}</span>
                    <button
                      onClick={() => handleDeleteFile(file._id)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={clearChat}
            className="mt-4 w-full px-3 py-2 text-sm text-red-600 border border-red-300 rounded-md hover:bg-red-50"
          >
            Clear Chat
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-2xl px-6 py-4 rounded-2xl shadow-sm ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                    : 'bg-white text-gray-800 border border-gray-100'
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                <p className={`text-xs mt-2 ${
                  message.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                }`}>
                  {new Date(message.createdAt || message.created_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white text-gray-800 border border-gray-100 max-w-2xl px-6 py-4 rounded-2xl shadow-sm">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                  <span className="text-sm text-gray-500">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t bg-white p-6">
          {/* Image Preview */}
          {imagePreview && (
            <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-20 h-20 object-cover rounded-lg shadow-sm"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Image selected</p>
                      <p className="text-xs text-gray-500 truncate">{selectedImage?.name}</p>
                    </div>
                    <button
                      onClick={clearSelectedImage}
                      className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center space-x-2">
                    <Image className="w-4 h-4 text-blue-500" />
                    <span className="text-xs text-blue-600 font-medium">Ready for AI analysis</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
            {/* File Upload Button */}
            <div className="flex space-x-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:from-purple-600 hover:to-pink-600 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl transform hover:scale-105"
                title="Upload image for AI analysis"
              >
                <Image className="w-5 h-5" />
              </label>
            </div>
            
            {/* Text Input */}
            <div className="flex-1">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={selectedImage ? "Ask about the image or leave blank for analysis..." : "Type your message..."}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors text-gray-800 placeholder-gray-500"
                disabled={loading}
              />
            </div>
            
            {/* Send Button */}
            <button
              type="submit"
              disabled={loading || (!newMessage.trim() && !selectedImage)}
              className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          
          {/* Helper Text */}
          <div className="mt-3 flex items-center justify-center space-x-4 text-xs text-gray-400">
            <div className="flex items-center space-x-1">
              <Image className="w-3 h-3" />
              <span>Upload images for AI analysis</span>
            </div>
            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
            <div className="flex items-center space-x-1">
              <Paperclip className="w-3 h-3" />
              <span>Supports JPG, PNG, GIF</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;