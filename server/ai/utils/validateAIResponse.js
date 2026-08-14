exports.validateAIResponse = (data) => {
    if (!data || typeof data !== 'object') {
        throw new Error("Response is not a valid object");
    }

    if (data.validProduct === false) {
        if (!data.message) {
            data.message = "Please enter a valid product name.";
        }
        return data; // Return early if it's explicitly invalid
    }

    // Default structural checks for valid product parsing based on new schema
    const schemaTemplate = {
        validProduct: true,
        productName: data.productName || "Unknown Product",
        category: data.category || "ELECTRONICS",
        subcategory: data.subcategory || "Other Electronics",
        tags: Array.isArray(data.tags) ? data.tags : [],
        searchKeywords: Array.isArray(data.searchKeywords) ? data.searchKeywords : [],
        brand: data.brand || "Unknown",
        model: data.model || "",
        condition: data.condition || "GOOD",
        conditionConfidence: data.conditionConfidence || "LOW",
        estimatedAge: data.estimatedAge || "AGE_NOT_PROVIDED",
        visibleFeatures: Array.isArray(data.visibleFeatures) ? data.visibleFeatures : [],
        includedItems: Array.isArray(data.includedItems) ? data.includedItems : [],
        visibleDamage: Array.isArray(data.visibleDamage) ? data.visibleDamage : [],
        priceRange: {
            min: data.priceRange?.min || 0,
            max: data.priceRange?.max || 0
        },
        recommendedPrice: data.recommendedPrice || 0,
        priceReason: data.priceReason || "Estimate based on market depreciation.",
        descriptions: {
            short35: data.descriptions?.short35 || "Product description unavailable.",
            medium55: data.descriptions?.medium55 || "Detailed description unavailable.",
            detailed80: data.descriptions?.detailed80 || "Full review description unavailable."
        }
    };

    return schemaTemplate;
};
