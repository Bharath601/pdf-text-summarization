from flask import Flask, request, jsonify
from transformers import PegasusForConditionalGeneration, PegasusTokenizer
from transformers import BertTokenizer, BertForQuestionAnswering
from textblob import TextBlob
from pypdf import PdfReader
import torch
import re
from flask_cors import CORS
import openai
from langchain.text_splitter import CharacterTextSplitter
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import logging
local_summary=""
latest_text = ""


app = Flask(__name__)
CORS(app)  # Enable CORS for all domains


#bert 
bert_model_name = "bert-large-uncased-whole-word-masking-finetuned-squad"
bert_model = BertForQuestionAnswering.from_pretrained(bert_model_name)
bert_tokenizer = BertTokenizer.from_pretrained(bert_model_name)


# pegasus-cnn-dailymail
model_name = "pegasus-cnn_dailymail"
tokenizer = PegasusTokenizer.from_pretrained(model_name)
model = PegasusForConditionalGeneration.from_pretrained(model_name)
local_unsummarised = ""

#t5 grammar 
tokenizer_gc = AutoTokenizer.from_pretrained("vennify/t5-base-grammar-correction")
model_gc = AutoModelForSeq2SeqLM.from_pretrained("vennify/t5-base-grammar-correction")


# chunking and merging
# def text_split(text):
#     print("text_split function")
#     print("the text is "+text)
#     # Initialize variables
#     remaining_text = text
#     final_summary = ""
#     while len(remaining_text) > 0:
#         text_splitter = CharacterTextSplitter(
#             separator='\n',
#             chunk_size=1000,
#         )
#         chunks = text_splitter.split_text(remaining_text)
#         first_chunk_summary = summarize(chunks[0])
#         final_summary += " " + first_chunk_summary
#         remaining_text = first_chunk_summary + " " + " ".join(chunks[1:])

       
#         if len(remaining_text.split()) <= 800:
#             final_summary += " " + summarize(remaining_text)
#             break

#     return final_summary.strip()

def text_split(text):
    print("text_split function")
    print("the text is "+text)
    # Initialize variables
    remaining_text = text
    final_summary = ""
    
    # Define the chunk size and the maximum size for the final summary
    chunk_size = 1000  # Adjust this size as needed
    max_summary_size = 800  # Adjust this threshold as needed

    # Split the text into chunks
    text_splitter = CharacterTextSplitter(separator='\n', chunk_size=chunk_size)
    chunks = text_splitter.split_text(remaining_text)

    # Process each chunk
    for chunk in chunks:
        # Summarize the current chunk
        chunk_summary = summarize(chunk)
        
        # Add the summary of the chunk to the final summary
        final_summary += " " + chunk_summary

        # If the final summary reaches a certain size, break the loop
        if len(final_summary.split()) >= max_summary_size:
            break

    # Return the final summary trimmed to the maximum summary size
    return final_summary.strip()



def summarize(text):
    tokens = tokenizer.encode(text, return_tensors='pt', truncation=True)
    num_tokens = tokens.shape[1]
    print(num_tokens)
    print(len(text))
    summary_ids = model.generate(tokens, max_length=500, min_length=1, length_penalty=2.0, num_beams=4, early_stopping=True)
    summary = tokenizer.decode(summary_ids[0], skip_special_tokens=True)
    summary = re.sub(r'<n>', ' ', summary)
    blob = TextBlob(summary)
    corrected_summary = str(blob.correct())
    local_summary= corrected_summary
    return corrected_summary



@app.route('/suggest-corrections', methods=['POST'])
def suggest_corrections():
    data = request.get_json()
    text = data.get('text')
    
    openai.api_key = "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"

    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Correct the grammar of the following text."},
                {"role": "user", "content": text}
            ],
            
        )

        if 'choices' in response and response['choices']:
            corrected_text = response['choices'][0]['message']['content'].strip()
            return jsonify([{'original': text, 'corrected': corrected_text}])
        else:
            return jsonify({"error": "No response from OpenAI."}), 500

    except openai.error.OpenAIError as e:
        logging.exception("OpenAIError processing the request:")
        return jsonify({"error": "Failed to process request: " + str(e)}), 500
    except Exception as e:
        logging.exception("Error processing the request:")
        return jsonify({"error": "Failed to process request: " + str(e)}), 500


# @app.route('/suggest-corrections', methods=['POST'])
# def correct_grammar():
#     try:
#         data = request.get_json()
#         text = data['text']
        
        
#         inputs = tokenizer_gc.encode(text, return_tensors="pt", max_length=512, truncation=True)
        
        
#         outputs = model_gc.generate(inputs, max_length=512, num_beams=4, early_stopping=True)
        
        
#         corrected_text = tokenizer_gc.decode(outputs[0], skip_special_tokens=True)
        
#         return jsonify({"correctedText": corrected_text})
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500



# @app.route('/chat-bot', methods=['POST'])
# def ask_question():
#     data = request.get_json()
#     context = data['summary']
#     question = data['question']
    
#     inputs = bert_tokenizer.encode_plus(question, context, add_special_tokens=True, return_tensors="pt")
#     input_ids = inputs["input_ids"].tolist()[0]

#     answers = bert_model(**inputs)
#     answer_start_scores = answers.start_logits
#     answer_end_scores = answers.end_logits

#     answer_start = torch.argmax(answer_start_scores)
#     answer_end = torch.argmax(answer_end_scores) + 1

#     answer = bert_tokenizer.convert_tokens_to_string(bert_tokenizer.convert_ids_to_tokens(input_ids[answer_start:answer_end]))
    
#     return jsonify({"answer": answer})


openai.api_key = "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"
@app.route('/chat-bot', methods=['POST'])
def chatbot():
    data = request.get_json()
    summary = data['summary']
    text = data['question']
    print('You are a chatbot. You should only answer questions related to: '+summary)
    max_tokens=50
    try:
        
        completion = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a chatbot and are suppposed to answer questions related only to the content I give you as a summary now, OK? The summary is: "+ summary},
              
                
                {"role": "user", "content": text+"?"+"for this question answer me from the this summary ="+ summary}
            ],
            max_tokens=max_tokens
        )
        
        reply = completion['choices'][0]['message']['content']
        
    
        return jsonify({"reply": reply})
    
    except openai.error.OpenAIError as e:

        print(e)
        return jsonify({"error": "Failed to process request: " + str(e)}), 500





    

    

@app.route('/summarize', methods=['POST'])
def summarize_text():
    global latest_text
    data = request.get_json()
    if 'text' not in data:
        return jsonify({"error": "No text provided for summarization"}), 400
    text = data['text']
    latest_text = text
    words = text.split()
    try:
      
        corrected_text = text_split(text)
        return jsonify({"summary": corrected_text})
    except Exception as e:
        return jsonify({"error": "Failed to summarize text: " + str(e)}), 500


@app.route('/summarize-pdf', methods=['POST'])
def summarize_pdf():
    global latest_text
    file = request.files['file']

    try:
        reader = PdfReader(file)
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        print("The text is ")
        latest_text = text  # Update the global variable with the extracted text
        print(text)  # Print the length of the extracted text
        corrected_text = text_split(text)
        return jsonify({"summary": corrected_text})
    except Exception as e:
        return jsonify({"error": "Failed to summarize PDF: " + str(e)}), 500

@app.route('/get-extracted-text', methods=['GET'])
def get_extracted_text():
    global latest_text
    print("latest_text at the beginning of /get-extracted-text:", len(latest_text))
    if not latest_text:
        return jsonify({"error": "No text has been processed yet"}), 400
    return jsonify({"extractedText": latest_text})



if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=3000)  # Ensure this matches your frontend configuration

