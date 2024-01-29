import React, { useState, useCallback } from "react";
import { FileUploader } from "react-drag-drop-files";
import axios from "axios";
import config from "./config/api_key.json";
import CircularProgress from '@mui/joy/CircularProgress';
import imageCompression from 'browser-image-compression';

function App() {
  const fileTypes = ["JPG", "JPEG", "PNG", "SVG"];
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generatedText, setGeneratedText] = useState("");

  const handleDrop = useCallback(async (file) => {
    if (file) {
      const options = {
        maxSizeMB: 3,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      }

      try
      {
        const compressedFile = await imageCompression(file, options);
        const base64Data = await fileToBase64(compressedFile);
        setImages([{ src: base64Data, name: compressedFile.name }]);
      }
      catch(error)
      {
        console.log(error);
      }
    }
  }, []);

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = (error) => reject(error);

      reader.readAsDataURL(file);
    });
  };

  const trimLeadingWhitespace = (sentence) => {
    let trimmedSentence = sentence.replace(/^\s+/, '');
    return trimmedSentence;
  }

  const handleGenerate = async () => {
    if (images.length === 0 || images === null) {
      console.log("No image");
      return;
    }
  
    try {
      const apiKey = config.apiKey;
      const prompt = "I need you act as the caption provider for this image. Makes the caption looks simple and straight to the point. If you are captioning the food, please do not mention all of the ingredients, make it simple and only describe ingradients that most accurate only. Do not use uppercase for the first letter. Do not adding full stop at the end. No uppercase unless for proper nouns. Do not using the name of the people even you know the name, still using man or woman to describe. Caption must be english. What is this picture caption? All the caption within 5 until 15 words. Caption end with on the floor, on the grass, in the forest, besides of item's name was accepted. Ensure the correct use of preposition (by/at/into/with)​. Ensure the correct use of pronouns (he/she/it/they/them)​. Caption can be simplified, but must relate to image​. Caption must be lower case except for names​ . Ensure captions does not include subjective terms​(emotions[happy,sad,suppriced]/sizes[big,small]/looks[cute/urgly/buetiful]). Ensure captions does not include phrases (there are/ a view of/ a picture of). Avoid describing the sky unless it is focused. Please use general term for human such as children, people, women, woman, men, man. Don't assume and guessing picture object relationship such as wild/pet/human's relationships[father,mother,husband,friends]. Do not using words like mother, father, mom, girlfriend, boyfriend, numbers of friends. Using verb to describe aciton. With the case not enough words can using a, the, an. Using two, three and following numbers of men or women instead of two, three or following numbers of friends.";
      const imagePart = {
        inline_data: {
          mime_type: "image/jpeg",
          data: images[0].src,
        },
      };
  
      const requestData = {
        contents: [
          {
            parts: [{ text: prompt }, imagePart],
          },
        ],
      };
  
      setLoading(true);
  
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent`,
        requestData,
        {
          params: {
            key: apiKey,
          },
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
  
      setLoading(false);
  
      let generatedText = response.data?.candidates[0]?.content?.parts[0]?.text.toString();
      let trimmedSentence = trimLeadingWhitespace(generatedText);
      let firstCharSmallLetterSentences = trimmedSentence.at(0).toLowerCase() + trimmedSentence.slice(1)
      setGeneratedText(firstCharSmallLetterSentences);
      if (firstCharSmallLetterSentences.slice(-1) == '.') { 
        let deleteDot = firstCharSmallLetterSentences.slice(0, -1);
        setGeneratedText(deleteDot);
    }
    } catch (error) {
      console.error("Error generating content :", error);
      setLoading(false);
    }
  };

  const imageNotNull = images[0];

  return (
    <div>
      {imageNotNull ? (
        <img
          src={`data:image/jpeg;base64,${images[0].src}`}
          alt={images.name}
          style={{ maxWidth: "50%", maxHeight: "50%", margin: "5px" }}
        />
      ) : (
        <></>
      )}

      <FileUploader handleChange={handleDrop} name="file" types={fileTypes} />

      {loading ? (
        <CircularProgress />
       ) : (
        <button onClick={handleGenerate}>
        Generate Caption
      </button>
      )}

      {generatedText && <div>Generated Text :{generatedText}</div>}
    </div>
  );
}

export default App;
