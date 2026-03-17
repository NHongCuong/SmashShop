import Category from "../models/category.model.js";


export const fetchAllCategory = async (req, res) => {
    try {
        const category = await Category.find()
        if (!category){
            res.status(404).json({success: false, message: 'Not find category'})
        } 
        res.status(200).json({success: true, data: category })
    } catch (e) {
        console.error(e.message)
        return res.status(500).json({success: false, message: 'Server Error'})
    }

}
