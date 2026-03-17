import Type from "../models/type.model.js";

export const fetchAllType = async (req, res) => {
    try {
        const type = await Type.find();
        if (!type) {
            res.status(404).json({ success: false, message: 'Not find type' });
        }
        res.status(200).json({ success: true, data: type });
    } catch (e) {
        console.error(e.message);
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
};
