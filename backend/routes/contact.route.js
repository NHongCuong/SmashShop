import express from 'express';
import { createContact, getContacts, updateContactStatus, deleteContact } from '../controllers/contact.controller.js';

const router = express.Router();

router.route('/')
    .post(createContact)
    .get(getContacts);

router.route('/:id')
    .put(updateContactStatus)
    .delete(deleteContact);

export default router;
