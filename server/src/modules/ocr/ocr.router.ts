import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { OcrController } from './ocr.controller';
import { authenticate } from '@middlewares/authenticate';
import { authorize } from '@middlewares/authorize';

const uploadDir = path.resolve(process.cwd(), 'tmp/ocr-uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
    dest: uploadDir,
    limits: {
        fileSize: 8 * 1024 * 1024,
    },
});

const router = Router();
const ctrl = new OcrController();

router.use(authenticate);
router.use(authorize('admin', 'inventory_manager'));

router.post('/upload', upload.single('file'), ctrl.upload);
router.get('/job/:id', ctrl.getJob);
router.post('/confirm', ctrl.confirm);

export default router;
