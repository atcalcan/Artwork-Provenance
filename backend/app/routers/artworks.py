"""
Artworks API router
Endpoints for managing artworks
"""
import structlog
from fastapi import APIRouter, Query, Request
from app.services.external_data import DBpediaService, WikidataService, GettyService

logger = structlog.get_logger()
router = APIRouter()

dbpedia = DBpediaService()
wikidata = WikidataService()
getty = GettyService()


@router.get("/")
async def list_artworks(
    request: Request,
    type_id: str = Query(None, description="Filter by type ID"),
    material_id: str = Query(None, description="Filter by material ID"),
    subject_id: str = Query(None, description="Filter by subject ID"),
    artist_id: str = Query(None, description="Filter by artist ID"),
    location_id: str = Query(None, description="Filter by location ID"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of results")
):
    """List all artworks with optional filters"""
    
    rdf_service = request.app.state.rdf_service
    
    try:
        filters = {}
        if type_id:
            filters['type_uri'] = f"http://arp-greatteam.org/heritage-provenance/attributes/{type_id}"
        if material_id:
            filters['material_uri'] = f"http://arp-greatteam.org/heritage-provenance/attributes/{material_id}"
        if subject_id:
            filters['subject_uri'] = f"http://arp-greatteam.org/heritage-provenance/attributes/{subject_id}"
        if artist_id:
            filters['artist_uri'] = f"http://arp-greatteam.org/heritage-provenance/artist/{artist_id}"
        if location_id:
            filters['location_uri'] = f"http://arp-greatteam.org/heritage-provenance/location/{location_id}"
        
        artworks = rdf_service.get_all_artworks(filters=filters, limit=limit)
        return {
            "count": len(artworks),
            "artworks": artworks
        }
    except Exception as e:
        logger.error(f"Error retrieving artworks: {e}")
        return {
            "error": "Failed to retrieve artworks",
            "count": 0,
            "artworks": []
        }

@router.get("/{artwork_id}")
async def get_artwork(artwork_id: str, request: Request):
    """Get a specific artwork by ID with complete details"""
    
    rdf_service = request.app.state.rdf_service
    artwork_uri = f"http://arp-greatteam.org/heritage-provenance/artwork/{artwork_id}"
    
    try:
        artwork = rdf_service.get_artwork(artwork_uri)
        
        if artwork is None:
            return {
                "error": "Artwork not found",
                "artwork_id": artwork_id
            }
        
        return artwork
        
    except Exception as e:
        logger.error(f"Error retrieving artwork {artwork_id}: {e}")
        return {
            "error": "Failed to retrieve artwork",
            "artwork_id": artwork_id
        }


@router.get("/{artwork_id}/enrich")
async def enrich_artwork(artwork_id: str, source: str = Query(..., regex="^(dbpedia|wikidata|getty)$")):
    """Enrich artwork data from external sources"""
    
    artwork_uri = f"http://arp-greatteam.org/heritage-provenance/artwork/{artwork_id}"