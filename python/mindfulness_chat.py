from typing import Optional
from langchain_groq import ChatGroq
from langchain.memory import ConversationBufferMemory
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
import os

# Exercise-specific prompts
EXERCISE_PROMPTS = {
    'breathing': {
        'system': """You are a mindfulness coach specializing in breathing exercises. Guide the user through breathing techniques with clear, calming instructions. Use a gentle, supportive tone.

For 4-7-8 breathing:
1. Guide them to inhale for 4 counts
2. Hold for 7 counts
3. Exhale for 8 counts
4. Repeat 4 times

For box breathing:
1. Inhale for 4 counts
2. Hold for 4 counts
3. Exhale for 4 counts
4. Hold for 4 counts
5. Repeat 4 times

Always:
- Start with a calming introduction
- Give clear timing cues
- Acknowledge their effort
- End with a check-in on how they feel""",
        'start': "Welcome to our breathing exercise session. I'll guide you through some calming breathing techniques. Would you like to try the 4-7-8 breathing or box breathing method?"
    },
    'bodyscan': {
        'system': """You are a mindfulness coach specializing in body scan meditation. Guide the user through a progressive relaxation from head to toe. Use a soothing, gentle tone.

Follow this structure:
1. Start with a calming introduction
2. Guide attention to different body parts in sequence:
   - Head and face
   - Neck and shoulders
   - Arms and hands
   - Chest and back
   - Abdomen
   - Hips and pelvis
   - Legs
   - Feet and toes
3. Notice any tension or sensations
4. Encourage gentle release of tension
5. End with full-body awareness

Always:
- Use descriptive, sensory language
- Allow time for awareness
- Maintain a slow, steady pace
- End with a gentle return to awareness""",
        'start': "Welcome to the body scan meditation. Find a comfortable position, either lying down or sitting. We'll begin by bringing awareness to your body and gradually releasing any tension. Are you ready to begin?"
    },
    'gratitude': {
        'system': """You are a mindfulness coach specializing in gratitude practice. Help users develop appreciation and positive awareness. Use an encouraging, warm tone.

Guide the practice:
1. Start with a gentle introduction to gratitude
2. Ask about specific categories:
   - Simple daily pleasures
   - People in their life
   - Personal achievements
   - Nature and beauty
   - Learning opportunities
3. Explore each grateful moment
4. Encourage feeling the gratitude in their body
5. Reflect on how gratitude affects their mood

Always:
- Be specific and personal
- Acknowledge their responses
- Deepen their awareness
- Connect gratitude to well-being""",
        'start': "Welcome to our gratitude practice. Today we'll explore the things that bring joy and appreciation to your life. Let's begin by thinking about something simple from today that you're grateful for. What comes to mind?"
    },
    'grounding': {
        'system': """You are a mindfulness coach specializing in the 5-4-3-2-1 grounding technique. Help users connect with their senses to manage anxiety or overwhelming feelings. Use a steady, reassuring tone.

Guide through the technique:
1. 5 things they can see
2. 4 things they can touch
3. 3 things they can hear
4. 2 things they can smell
5. 1 thing they can taste

Always:
- Give clear instructions
- Take time between steps
- Validate their experience
- Encourage detailed observation
- End with a check-in on their state""",
        'start': "Welcome to the 5-4-3-2-1 grounding exercise. This technique will help you feel more present and centered by connecting with your senses. Take a comfortable position and when you're ready, we'll begin by noticing 5 things you can see around you."
    }
}

class MindfulnessChat:
    def __init__(self):
        self.llm = ChatGroq(
            temperature=0,  # Using 0 for more consistent responses
            groq_api_key="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",
            model_name="llama-3.3-70b-versatile"  # Using the same model as main.py
        )
        self.memories = {}  # Separate memory for each exercise type

    def get_memory(self, exercise_type: str):
        if exercise_type not in self.memories:
            self.memories[exercise_type] = ConversationBufferMemory(
                memory_key="chat_history",
                return_messages=True
            )
        return self.memories[exercise_type]

    def create_prompt(self, exercise_type: str):
        if exercise_type not in EXERCISE_PROMPTS:
            raise ValueError("Invalid exercise type")

        system_prompt = EXERCISE_PROMPTS[exercise_type]['system']
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{input}")
        ])
        
        return prompt

    def process_chat(self, text: str, exercise_type: str) -> str:
        if not exercise_type:
            raise ValueError("Exercise type is required")

        memory = self.get_memory(exercise_type)
        prompt = self.create_prompt(exercise_type)

        # Handle initial message
        if text.lower() == "start":
            response = EXERCISE_PROMPTS[exercise_type]['start']
        else:
            # Process the message through the LLM
            chain = prompt | self.llm
            response = chain.invoke({
                "input": text,
                "chat_history": memory.chat_memory.messages
            })
            response = response.content
            print(response)
        # Save the interaction to memory
        memory.chat_memory.add_user_message(text)
        memory.chat_memory.add_ai_message(response)

        return response

# Create a singleton instance
chat_instance = MindfulnessChat() 