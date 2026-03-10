export const COLLEGES_COURSES = [
    {
        id: "sci-gen",
        name: "Science - General",
        faculty: "General Science",
        subjects: ["English", "Physics", "Chemistry", "Biology", "Mathematics", "Marathi/Hindi"]
    },
    {
        id: "sci-elec",
        name: "Science - Bifocal (Electronics)",
        faculty: "Bifocal Science",
        subjects: ["English", "Physics", "Chemistry", "Mathematics", "Electronics-1", "Electronics-2"]
    },
    {
        id: "sci-cs",
        name: "Science - Bifocal (Computer Science)",
        faculty: "Bifocal Science",
        subjects: ["English", "Physics", "Chemistry", "Mathematics", "Computer Sci-1", "Computer Sci-2"]
    },
    {
        id: "sci-fish",
        name: "Science - Bifocal (Fisheries)",
        faculty: "Bifocal Science",
        subjects: ["English", "Physics", "Chemistry", "Biology", "Fisheries-1", "Fisheries-2"]
    },
    {
        id: "comm-gen",
        name: "Commerce - General",
        faculty: "General Commerce",
        subjects: ["English", "Book Keeping", "Economics", "OCM", "SP/Mathematics", "Marathi/Hindi/IT"]
    },
    {
        id: "arts-gen",
        name: "Arts - General",
        faculty: "General Arts",
        subjects: ["English", "Political Science", "History", "Economics", "Sociology", "Marathi/Hindi"]
    },
    {
        id: "voc-elec",
        name: "H.S.C. Vocational (Electronics Tech)",
        faculty: "Vocational",
        subjects: ["English", "Gen Foundation", "Electronics Tech-1", "Electronics Tech-2", "Electronics Tech-3"]
    },
    {
        id: "voc-fish",
        name: "H.S.C. Vocational (Fisheries Tech)",
        faculty: "Vocational",
        subjects: ["English", "Gen Foundation", "Fisheries Tech-1", "Fisheries Tech-2", "Fisheries Tech-3"]
    },
];

// COLLEGES_CLASSES is now managed via Firestore at /admin/classes
// Components should fetch from 'classes' collection instead of using hardcoded values.
