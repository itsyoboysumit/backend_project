import multer from 'multer';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/temp'); // Specify the directory to save uploaded files
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // Use current timestamp to avoid name conflicts
    }
})

export const upload = multer({
    storage,
})