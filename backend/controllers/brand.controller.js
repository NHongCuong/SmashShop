import Brand from "../models/brand.model.js"

// export const getBrands = async(req, res) =>{
//     try {
//         const brands = Brand.
//     }
// }

export const createBrands = async(req, res) => {

    const brand = req.body;
    if (!brand.name){
            return res.status(400).json({success: false, message: "Please provide all fields"})
    }
    brand.brand_id = Number(brand.brand_id)
    const newBrand = new Brand(brand)

    try {
        await newBrand.save();
        res.status(200).json({success: true, data: newBrand})
    } catch (e) {
        console.error("Error in create brand: ", e.message)
        res.status(500).json({success: false, message: "Server error"})
    }
};

export const fetchAllBrand = async(req, res) => {
    try {
        const brand = await Brand.find()
        if (!brand){
            res.status(404).json({success: false, message: 'Not find brand'})
        } 
        res.status(200).json({success: true, data: brand })
    } catch (e) {
        console.error(e.message)
        return res.status(500).json({success: false, message: 'Server Error'})
    }
}

