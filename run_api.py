from flask import Flask, request, jsonify
from flask_cors import CORS
import gpt_2_simple as gpt2
import tensorflow as tf

app = Flask(__name__)
CORS(app)

sess = None
graph = None
current_run_name = None

def load_model(run_name):
    """Load a model if it's different from the currently loaded one"""
    global sess, graph, current_run_name
    
    # Only load if it's a different model
    if run_name != current_run_name:
        # Clean up existing session if there is one
        if sess is not None:
            sess.close()
        
        # Create new session and load model
        graph = tf.Graph()
        with graph.as_default():
            sess = gpt2.start_tf_sess()
            gpt2.load_gpt2(sess, run_name=run_name)
            current_run_name = run_name

@app.route('/generate', methods=['POST'])
def generate_text():
    global sess, graph, current_run_name

    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400

        prompt = data.get('prompt', '')
        length = min(data.get('length', 100), 1000)
        temperature = max(0.1, min(data.get('temperature', 0.7), 1.0))
        top_p = max(0.1, min(data.get('top_p', 0.9), 1.0))
        nsamples = min(data.get('nsamples', 1), 5)
        batch_size = min(data.get('batch_size', 1), 5)
        run_name = data.get('run_name', 'dailydialog_run')

        if not prompt:
            return jsonify({'error': 'Prompt is required'}), 400

        # Load the model if needed
        load_model(run_name)

        with graph.as_default():
            generated = gpt2.generate(
                sess,
                run_name=run_name,
                prefix=prompt,
                length=length,
                temperature=temperature,
                top_p=top_p,
                nsamples=nsamples,
                batch_size=batch_size,
                return_as_list=True
            )

            if generated:
                response = generated[0]
                response = response.replace(prompt, "", 1)
                response = response.split('<|endoftext|>')[0]
                response = response.strip()

                return jsonify({
                    'generated_text': response,
                    'parameters': {
                        'prompt': prompt,
                        'length': length,
                        'temperature': temperature,
                        'top_p': top_p,
                        'nsamples': nsamples,
                        'batch_size': batch_size,
                        'run_name': run_name
                    }
                })

            return jsonify({'error': 'No text generated'}), 500

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'current_run_name': current_run_name
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=4850)