/* Clean, browser-safe chatbot script
   - Removes server-only references (process.env)
   - Restores response logic and event handlers
   - Uses Advice Slip API as a fallback (no auth required)
*/

const chatbotToggler = document.querySelector(".chatbot-toggler");
const closeBtn = document.querySelector(".close-btn");
const chatInput = document.querySelector(".chat-input textarea");
const sendChatbtn = document.querySelector(".chat-input span");
const chatbox = document.querySelector(".chatbox");

let userMessage = null; // Variable to store user's message

// NOTE: Do not store API keys in client-side code. If you need to use
// OpenAI or Gemini you'll need a server-side proxy that reads keys from
// environment variables. This client uses only the Advice Slip API (no key)
// for the external fallback and a set of local responses for common intents.

const inputInitHeight = chatInput ? chatInput.scrollHeight : 60;

// Local responses
const responses = {
  greeting: [
    'Hello! How are you today?',
    'Hi there! Great to see you!',
    'Hey! How can I help you today?',
    'Greetings! How is your day going?'
  ],
  farewell: [
    'Goodbye! Have a wonderful day!',
    'See you later! Take care!',
    'Bye! Hope to chat again soon!',
    'Take care! Come back anytime!'
  ],
  thanks: [
    'You\'re welcome! Happy to help!',
    'Glad I could assist!',
    'My pleasure! Need anything else?',
    'Anytime! That\'s what I\'m here for!'
  ],
  help: [
    'I can help with many topics! Try asking about general questions, calculations, or ask for advice.',
    'I can assist with simple math, friendly chat, and general info. What would you like?'
  ],
  name: [
    'I\'m ChatBot! Your friendly AI assistant!',
    'You can call me ChatBot! I\'m here to help and chat!'
  ],
  about: [
    'I\'m an AI chatbot created to help and chat with you!',
    'I\'m your friendly assistant — happy to answer questions and chat.'
  ],
  emotions: [
    'I\'m feeling great! Thanks for asking!',
    'I\'m here and ready to help — how can I assist you today?'
  ],
  jokes: [
    'Why don\'t programmers like nature? It has too many bugs!',
    'Why did the developer go broke? Because he used up all his cache.'
  ],
  hobbies: [
    'I love chatting and learning from conversations!',
    'I enjoy helping people and solving problems.'
  ],
  calculations: {
    addition: (a, b) => `The sum of ${a} and ${b} is ${a + b}`,
    multiplication: (a, b) => `${a} multiplied by ${b} equals ${a * b}`,
    subtraction: (a, b) => `${a} minus ${b} equals ${a - b}`
  },
  time: [
    'I can\'t read the system clock from here, but you can check your device time.',
    'I don\'t have a real-time clock in this UI, but I can help with time-related tips.'
  ],
  compliments: [
    'Thanks — you\'re too kind!',
    'Appreciate it! I\'m happy to help.'
  ],
  default: [
    'That\'s interesting — can you tell me a bit more?',
    'I\'m not sure about that, but I can try to help if you give me more details.'
  ]
};

const createChatLi = (message, className) => {
  const chatLi = document.createElement("li");
  chatLi.classList.add("chat", className);
  const chatContent = className === "outgoing"
    ? `<p></p>`
    : `<span class="material-symbols-outlined">smart_toy</span><p></p>`;
  chatLi.innerHTML = chatContent;
  chatLi.querySelector("p").textContent = message;
  return chatLi;
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const getRandomResponse = (arr) => arr[Math.floor(Math.random() * arr.length)];

const generateResponse = async (incomingChatli) => {
  const messageElement = incomingChatli.querySelector("p");
  const userMessageLower = (userMessage || "").toLowerCase();

  messageElement.textContent = "Thinking...";
  await sleep(800);

  try {
    // Simple math detection
    const mathMatch = userMessageLower.match(/(\d+(?:\.\d+)?)\s*([\+\-\*x])\s*(\d+(?:\.\d+)?)/);
    if (mathMatch) {
      const [, n1s, operator, n2s] = mathMatch;
      const n1 = parseFloat(n1s), n2 = parseFloat(n2s);
      if (operator === '+' ) return messageElement.textContent = responses.calculations.addition(n1, n2);
      if (operator === '-' ) return messageElement.textContent = responses.calculations.subtraction(n1, n2);
      if (operator === '*' || operator === 'x') return messageElement.textContent = responses.calculations.multiplication(n1, n2);
    }

    // Intents
    if (/\b(hi|hello|hey|greetings)\b/.test(userMessageLower)) {
      messageElement.textContent = getRandomResponse(responses.greeting);
    } else if (/\b(bye|goodbye|see you|farewell)\b/.test(userMessageLower)) {
      messageElement.textContent = getRandomResponse(responses.farewell);
    } else if (/\b(thanks|thank you|appreciate)\b/.test(userMessageLower)) {
      messageElement.textContent = getRandomResponse(responses.thanks);
    } else if (/\b(help|assist|support|what.?can.?you.?do)\b/.test(userMessageLower)) {
      messageElement.textContent = getRandomResponse(responses.help);
    } else if (/\b(your name|who are you)\b/.test(userMessageLower)) {
      messageElement.textContent = getRandomResponse(responses.name);
    } else if (/\b(how are you|feeling|mood)\b/.test(userMessageLower)) {
      messageElement.textContent = getRandomResponse(responses.emotions);
    } else if (/\b(tell.*joke|know.*joke|another joke|make me laugh)\b/.test(userMessageLower)) {
      messageElement.textContent = getRandomResponse(responses.jokes);
    } else if (/\b(hobby|hobbies|what do you like|what do you do)\b/.test(userMessageLower)) {
      messageElement.textContent = getRandomResponse(responses.hobbies);
    } else if (/\b(time|what.*time|current time)\b/.test(userMessageLower)) {
      messageElement.textContent = getRandomResponse(responses.time);
    } else if (/\b(you.*smart|you.*cool|you.*good|you.*great|you.*awesome)\b/.test(userMessageLower)) {
      messageElement.textContent = getRandomResponse(responses.compliments);
    } else if (userMessageLower.includes('about you')) {
      messageElement.textContent = getRandomResponse(responses.about);
    } else {
      // Fallback to Advice Slip API (no key required)
      try {
        const res = await fetch('https://api.adviceslip.com/advice', { cache: 'no-store' });
        const data = await res.json();
        if (data && data.slip && data.slip.advice) {
          messageElement.textContent = data.slip.advice;
        } else {
          messageElement.textContent = getRandomResponse(responses.default);
        }
      } catch (err) {
        messageElement.textContent = getRandomResponse(responses.default);
      }
    }
  } catch (err) {
    console.error('generateResponse error', err);
    messageElement.textContent = getRandomResponse(responses.default);
  } finally {
    chatbox.scrollTo(0, chatbox.scrollHeight);
  }
};

const handleChat = () => {
  userMessage = chatInput.value.trim();
  if (!userMessage) return;

  chatInput.value = '';
  chatInput.style.height = `${inputInitHeight}px`;

  const outgoingChatli = createChatLi(userMessage, 'outgoing');
  chatbox.appendChild(outgoingChatli);
  chatbox.scrollTo(0, chatbox.scrollHeight);

  setTimeout(() => {
    const incomingChatli = createChatLi('Typing...', 'incoming');
    chatbox.appendChild(incomingChatli);
    generateResponse(incomingChatli);
  }, 300);
};

// Auto-resize textarea
if (chatInput) {
  chatInput.addEventListener('input', () => {
    chatInput.style.height = `${inputInitHeight}px`;
    chatInput.style.height = `${chatInput.scrollHeight}px`;
  });

  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && window.innerWidth > 800) {
      e.preventDefault();
      handleChat();
    }
  });
}

if (sendChatbtn) sendChatbtn.addEventListener('click', handleChat);
if (closeBtn) closeBtn.addEventListener('click', () => document.body.classList.remove('show-chatbot'));
if (chatbotToggler) chatbotToggler.addEventListener('click', () => document.body.classList.toggle('show-chatbot'));
