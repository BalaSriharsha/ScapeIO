from typing import List, Dict
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.models import ScrapedData, ChatInteraction
from app.schemas import ChatResponse
from app.services.embedding_service import get_single_embedding
from app.config import settings
import google.generativeai as genai
import time

# Initialize Gemini client
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)
    gemini_model = genai.GenerativeModel('gemini-2.5-flash')
else:
    gemini_model = None

def generate_embed_code(job_id: int) -> str:
    api_url = settings.FRONTEND_URL.replace("3000", "8000")
    
    embed_code = f'''<!-- RAG Chatbot Widget -->
<div id="rag-chatbot-widget"></div>
<script>
  (function() {{
    const jobId = {job_id};
    const apiUrl = '{api_url}';
    
    const styles = `
      #rag-chatbot-container {{
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }}
      #rag-chatbot-button {{
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, #134686, #ED3F27);
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s;
      }}
      #rag-chatbot-button:hover {{
        transform: scale(1.05);
      }}
      #rag-chatbot-button svg {{
        width: 30px;
        height: 30px;
        fill: white;
      }}
      #rag-chatbot-window {{
        position: absolute;
        bottom: 80px;
        right: 0;
        width: 380px;
        height: 500px;
        background: #FDF4E3;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        display: none;
        flex-direction: column;
        overflow: hidden;
      }}
      #rag-chatbot-window.open {{
        display: flex;
      }}
      #rag-chatbot-header {{
        background: linear-gradient(135deg, #134686, #ED3F27);
        color: white;
        padding: 16px;
        font-weight: 600;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }}
      #rag-chatbot-close {{
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 30px;
        height: 30px;
      }}
      #rag-chatbot-messages {{
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }}
      .rag-message {{
        max-width: 80%;
        padding: 10px 14px;
        border-radius: 12px;
        word-wrap: break-word;
      }}
      .rag-message.user {{
        background: #134686;
        color: white;
        align-self: flex-end;
        margin-left: auto;
      }}
      .rag-message.bot {{
        background: white;
        color: #134686;
        align-self: flex-start;
        border: 1px solid #134686;
      }}
      #rag-chatbot-input-container {{
        padding: 16px;
        border-top: 1px solid #134686;
        display: flex;
        gap: 8px;
      }}
      #rag-chatbot-input {{
        flex: 1;
        padding: 10px;
        border: 2px solid #134686;
        border-radius: 8px;
        background: white;
        color: #134686;
        font-size: 14px;
      }}
      #rag-chatbot-send {{
        padding: 10px 20px;
        background: #134686;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
      }}
      #rag-chatbot-send:hover {{
        background: #ED3F27;
      }}
      #rag-chatbot-send:disabled {{
        background: #ccc;
        cursor: not-allowed;
      }}
    `;
    
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
    
    const container = document.createElement('div');
    container.id = 'rag-chatbot-container';
    container.innerHTML = `
      <button id="rag-chatbot-button">
        <svg viewBox="0 0 24 24">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
        </svg>
      </button>
      <div id="rag-chatbot-window">
        <div id="rag-chatbot-header">
          <span>Ask me anything</span>
          <button id="rag-chatbot-close">&times;</button>
        </div>
        <div id="rag-chatbot-messages"></div>
        <div id="rag-chatbot-input-container">
          <input type="text" id="rag-chatbot-input" placeholder="Type your message...">
          <button id="rag-chatbot-send">Send</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(container);
    
    const button = document.getElementById('rag-chatbot-button');
    const window = document.getElementById('rag-chatbot-window');
    const closeBtn = document.getElementById('rag-chatbot-close');
    const input = document.getElementById('rag-chatbot-input');
    const sendBtn = document.getElementById('rag-chatbot-send');
    const messages = document.getElementById('rag-chatbot-messages');
    
    let conversationHistory = [];
    
    button.addEventListener('click', () => window.classList.add('open'));
    closeBtn.addEventListener('click', () => window.classList.remove('open'));
    
    function formatMarkdown(text) {{
      // Convert markdown to HTML
      return text
        // Headers
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        // Bold
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/__(.*?)__/g, '<strong>$1</strong>')
        // Italic
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/_(.*?)_/g, '<em>$1</em>')
        // Lists
        .replace(/^\* (.*$)/gim, '<li>$1</li>')
        .replace(/^- (.*$)/gim, '<li>$1</li>')
        .replace(/^(\d+)\. (.*$)/gim, '<li>$2</li>')
        // Wrap consecutive list items in ul
        .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
        // Line breaks
        .replace(/\n/g, '<br>')
        // Clean up multiple ul tags
        .replace(/<\/ul>\s*<ul>/g, '');
    }}
    
    function addMessage(text, isUser) {{
      const msg = document.createElement('div');
      msg.className = `rag-message ${{isUser ? 'user' : 'bot'}}`;
      
      if (isUser) {{
        msg.textContent = text;
      }} else {{
        msg.innerHTML = formatMarkdown(text);
      }}
      
      messages.appendChild(msg);
      messages.scrollTop = messages.scrollHeight;
    }}
    
    async function sendMessage() {{
      const message = input.value.trim();
      if (!message) return;
      
      addMessage(message, true);
      input.value = '';
      sendBtn.disabled = true;
      
      conversationHistory.push({{ role: 'user', content: message }});
      
      try {{
        const response = await fetch(`${{apiUrl}}/api/chatbot/chat`, {{
          method: 'POST',
          headers: {{ 'Content-Type': 'application/json' }},
          body: JSON.stringify({{
            job_id: jobId,
            message: message,
            conversation_history: conversationHistory
          }})
        }});
        
        const data = await response.json();
        addMessage(data.response, false);
        conversationHistory.push({{ role: 'assistant', content: data.response }});
      }} catch (error) {{
        addMessage('Sorry, I encountered an error. Please try again.', false);
      }} finally {{
        sendBtn.disabled = false;
      }}
    }}
    
    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {{
      if (e.key === 'Enter') sendMessage();
    }});
    
    addMessage('Hello! How can I help you today?', false);
  }})();
</script>'''
    
    return embed_code

async def get_chat_response(job_id: int, message: str, conversation_history: List[Dict], db: Session, user_id: int = None) -> ChatResponse:
    start_time = time.time()
    try:
        query_embedding = get_single_embedding(message)
        
        # Convert embedding list to proper PostgreSQL vector format
        embedding_str = '[' + ','.join(map(str, query_embedding)) + ']'
        
        # Increased limit from 15 to 25 for better context coverage
        query = text("""
            SELECT content, url, (embedding <=> CAST(:query_embedding AS vector)) as distance
            FROM scraped_data
            WHERE job_id = :job_id
            ORDER BY distance
        """)
        
        results = db.execute(query, {"query_embedding": embedding_str, "job_id": job_id}).fetchall()
        
        if not results:
            return ChatResponse(
                response="I apologize, but the provided context does not contain information on this topic yet. Please make sure the scraping job has completed successfully.",
                sources=[]
            )
        
        # Include full content for each chunk (no truncation)
        context = "\n\n".join([f"Source: {row.url}\nContent: {row.content}" for row in results])
        sources = list(set([row.url for row in results]))  # Deduplicate sources
        
        system_message = """You are a helpful assistant that answers questions based ONLY on the provided context from the scraped website.

IMPORTANT INSTRUCTIONS:
1. Answer questions using ONLY the information provided in the context below
2. If specific details like pricing, features, or specifications are mentioned in the context, include them in your answer
3. Be thorough and comprehensive - don't omit details that are present in the context
4. If the information is partially available, provide what you can find and note what's missing
5. Only say "information not available" if it's truly not in the context at all
6. When providing lists or details, be complete and accurate
7. Do not make up or infer information that isn't explicitly stated

CONVERSATION CONTEXT AWARENESS:
- Consider the conversation history when answering questions
- If the user refers to previous topics (e.g., "more details about that", "what else?", "tell me more"),
  use the conversation history to understand what they're referring to
- Maintain conversation coherence and reference earlier points when relevant
- Build upon previous answers when asked follow-up questions

FORMATTING REQUIREMENTS:
- Format your response using proper markdown
- Use **bold** for emphasis on important terms
- Use bullet points (- or *) for lists
- Use numbered lists (1. 2. 3.) for sequential items
- Use ## for section headings when appropriate
- Make responses easy to read and well-structured
- Break long paragraphs into shorter, digestible sections

The context contains excerpts from the website that are most relevant to the user's question."""
        
        messages = [{"role": "system", "content": system_message}]
        messages.extend(conversation_history[-6:])
        messages.append({
            "role": "user",
            "content": f"Context:\n{context}\n\nQuestion: {message}"
        })
        
        try:
            if gemini_model:
                # Format messages for Gemini
                chat_history = []
                user_message = None
                
                for msg in messages:
                    if msg["role"] == "system":
                        # Add system message to the first user message
                        continue
                    elif msg["role"] == "user":
                        user_message = msg["content"]
                    elif msg["role"] == "assistant":
                        if user_message:
                            chat_history.append({"role": "user", "parts": [user_message]})
                            user_message = None
                        chat_history.append({"role": "model", "parts": [msg["content"]]})
                
                # Add final user message
                if user_message:
                    # Prepend system message to user's query
                    system_msg = next((m["content"] for m in messages if m["role"] == "system"), "")
                    full_prompt = f"{system_msg}\n\n{user_message}" if system_msg else user_message
                    
                    # Start chat with history
                    chat = gemini_model.start_chat(history=chat_history)
                    response = chat.send_message(full_prompt)
                    answer = response.text
                else:
                    answer = "I apologize, but I couldn't process your request. Please try again."
            else:
                answer = "This is a demo response. Please configure GEMINI_API_KEY for actual AI responses. Based on the context, I found information from: " + sources[0]
        except Exception as e:
            print(f"Error generating chat response: {str(e)}")
            import traceback
            traceback.print_exc()
            # If LLM fails, still provide useful information from context
            answer = f"Based on the scraped content: {context[:300]}..."
        
        # Calculate response time
        response_time_ms = int((time.time() - start_time) * 1000)
        
        # Record the interaction for analytics
        try:
            interaction = ChatInteraction(
                job_id=job_id,
                user_id=user_id,
                message=message,
                response=answer,
                response_time_ms=response_time_ms,
                sources_count=len(sources)
            )
            db.add(interaction)
            db.commit()
        except Exception as e:
            print(f"Error recording chat interaction: {str(e)}")
            # Don't fail the request if analytics recording fails
        
        return ChatResponse(response=answer, sources=sources)
    
    except Exception as e:
        print(f"Error in get_chat_response: {str(e)}")
        import traceback
        traceback.print_exc()
        raise

