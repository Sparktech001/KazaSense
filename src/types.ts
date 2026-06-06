export interface Diagnosis {
    id: string;
    lat: number;
    lng: number;
    type: string;
    disease: string;
    severity: string;
    recommendation: string;
    imageUrl?: string;
    timestamp: string;
}
