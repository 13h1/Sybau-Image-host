// pages/api/upload.js

import { IncomingForm } from 'formidable'; // Pour lire les données du formulaire (l'image)
import { v2 as cloudinary } from 'cloudinary'; // Le SDK Cloudinary

// Configure Cloudinary avec les clés secrètes du fichier .env.local
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Utiliser HTTPS pour les liens
});

// C'est important pour que Next.js laisse formidable gérer l'analyse du corps de la requête
export const config = {
  api: {
    bodyParser: false, // Désactive le parseur de corps par défaut de Next.js
  },
};

// La fonction principale qui gère la requête d'upload
export default async function handler(req, res) {
  if (req.method !== 'POST') { // Si ce n'est pas une requête POST (envoyer des données)
    return res.status(405).json({ message: 'Méthode non autorisée. Seul POST est accepté.' });
  }

  // On crée un nouvel analyseur de formulaire
  const form = new IncomingForm({ multiples: false }); // `multiples: false` car on n'attend qu'un seul fichier

  // On analyse la requête entrante
  form.parse(req, async (err, fields, files) => {
    if (err) { // S'il y a une erreur en analysant le formulaire
      console.error("Erreur de parsing du formulaire:", err);
      return res.status(500).json({ message: 'Erreur lors de la réception de l\'image.' });
    }

    // Récupère le fichier image et les champs de texte
    // Dans formidable v3+, les champs et fichiers sont dans des tableaux
    const imageFile = files.image ? files.image[0] : null;
    const description = fields.description ? fields.description[0] : '';
    const customName = fields.customName ? fields.customName[0] : '';

    if (!imageFile) { // Si aucun fichier image n'a été envoyé
      return res.status(400).json({ message: 'Aucun fichier image trouvé dans la requête.' });
    }

    try {
      // Prépare les options pour l'upload sur Cloudinary
      const uploadOptions = {
        folder: "discord-image-host", // Met les images dans un dossier "discord-image-host" sur Cloudinary
        resource_type: "image", // Spécifie que c'est une image
      };

      if (customName) {
        // Si l'utilisateur a donné un nom personnalisé, on l'utilise
        uploadOptions.public_id = customName;
        uploadOptions.overwrite = true; // Si un fichier avec ce nom existe déjà, on l'écrase
      }

      // Uploader l'image vers Cloudinary
      // `imageFile.filepath` est le chemin temporaire du fichier sur le serveur
      const result = await cloudinary.uploader.upload(imageFile.filepath, uploadOptions);

      // Si tout s'est bien passé, on renvoie le lien de l'image
      res.status(200).json({
        message: 'Image uploadée avec succès!',
        url: result.secure_url, // C'est le lien direct vers l'image sur Cloudinary (HTTPS)
        description: description, // On peut renvoyer la description si on veut
        publicId: result.public_id, // L'ID public de l'image sur Cloudinary
      });
    } catch (uploadError) {
      console.error("Erreur Cloudinary lors de l'upload:", uploadError);
      // Gère les erreurs spécifiques de Cloudinary, par exemple si le public_id existe déjà
      if (uploadError.http_code === 400 && uploadError.code === "already_exists") {
        return res.status(400).json({ message: `Le nom d'URL "${customName}" est déjà pris. Veuillez en choisir un autre.` });
      }
      res.status(500).json({ message: 'Erreur interne lors de l\'upload de l\'image.' });
    }
  });
}