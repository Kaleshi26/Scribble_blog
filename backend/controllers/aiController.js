import axios from 'axios';

export const getAISuggestions = async (req, res) => {
  const { prompt } = req.body;
  try {
    // Fallback: Rule-based suggestions for beginners
    if (!process.env.HUGGINGFACE_API_KEY) {
      const keywords = prompt.split(' ').slice(0, 3).map(word => word.toLowerCase());
      const suggestions = {
        title: `Top Tips for ${prompt}`,
        outline: [
          `Introduction to ${prompt}`,
          `Key Benefits of ${prompt}`,
          `How to Get Started with ${prompt}`
        ],
        seoKeywords: keywords
      };
      return res.json(suggestions);
    }

    // Hugging Face API call
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/gpt2',
      { inputs: `Generate a blog post outline about ${prompt}` },
      { headers: { Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}` } }
    );

    const suggestions = {
      title: `Blog on ${prompt}`,
      outline: response.data[0]?.generated_text?.split('\n').slice(0, 3),
      seoKeywords: prompt.split(' ').slice(0, 3)
    };
    res.json(suggestions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};