import React, { useState, useCallback } from "react";
import { FileUploader } from "react-drag-drop-files";
import axios from "axios"
import config from "./config/api_key.json";

window.addEventListener("dragover",function(e){
  e = e || event;
  e.preventDefault();
},false);
window.addEventListener("drop",function(e){
  e = e || event;
  e.preventDefault();
},false);

function App() {
  const fileTypes = ["JPG", "JPEG", "PNG", "SVG"];
  const [images, setImages] = useState([]);
  const [generatedText, setGeneratedText] = useState("");

  const handleDrop = useCallback(async (file) => {

    if (file) {
      const base64Data = await fileToBase64(file);
      setImages([{ src: base64Data, name: file.name }]);
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

  const handleGenerate = async () => {
    if(images == [] || images == null){
      console.log("No image");
      return
    }

    try {
      const apiKey = config.apiKey; // You need to create a app_key.json and fill it with your API key such as { "apiKey":"xxxxxxxxx"}
        
      const prompt = "I need you act as the caption provider for this image. Do not using the name of the people even you know the name, still using man or woman to describe. Caption must be english. What is this picture caption? All the caption within 5 until 15 words. Caption end with on the floor, on the grass, in the forest, besides of item's name was accepted. Ensure the correct use of preposition (by/at/into/with)​. Ensure the correct use of pronouns (he/she/it/they/them)​. Caption can be simplified, but must relate to image​. Caption must be lower case except for names​ . No uppercase unless for proper nouns. Do not adding fullstop at the end. Ensure captions does not include subjective terms​(emotions[happy,sad,suppriced]/sizes[big,small]/looks[cute/urgly/buetiful]). Ensure captions does not include phrases (there are/ a view of/ a picture of). Avoid describing the sky unless it is focused. Please use general term for human such as children, people, women, woman, men, man. Don't assume and guessing picture object relationship such as wild/pet/human's relationships[father,mother,husband,friends]. Do not using words like mother, father, mom, girlfriend, boyfriend, numbers of friends. Using verb to describe aciton. With the case not enough words can using a, the, an. Using two, three and following numbers of men or women instead of two, three or following numbers of friends.";
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

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent`,
        requestData,
        {
          params: {
            'key': apiKey
          },
          headers: {
            "Content-Type": "application/json",
          },
        }
      );


      
      const generatedText = response.data?.candidates[0]?.content?.parts[0]?.text;
      console.log(generatedText);
      setGeneratedText(generatedText);
    } catch (error) {
      console.error("Error generating content:", error);
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
      <button onClick={handleGenerate}>Generate Content</button>
      {generatedText && <div>Generated Text: {generatedText}</div>}
    </div>
  );
}

export default App;
