"""
Recommendations API router
Endpoints for recommendations
"""
import structlog
from typing import List
from fastapi import APIRouter, Request, Query
from app.models import ArtworkType, Recommendation, RecommendationRequest, Artwork, Agent, Location
from app.services.recommendations import RecommendationEngine

logger = structlog.get_logger()
router = APIRouter()

recommendation_engine = RecommendationEngine()


@router.post("/", response_model=List[Recommendation])
async def get_recommendations(
    rec_request: RecommendationRequest,
    request: Request
):
    """Get artwork recommendations based on a target artwork"""
    
    logger.info(f"Generating recommendations for: {rec_request.artwork_uri}")
    
    return []


@router.get("/{artwork_id}", response_model=List[Recommendation])
async def get_recommendations_for_artwork(
    artwork_id: str,
    request: Request,
    max_results: int = Query(10, ge=1, le=50),
    criteria: str = Query("artist,period,type,location", description="Comma-separated criteria")
):
    """Get recommendations for a specific artwork"""
    
    artwork_uri = f"http://arp-greatteam.org/heritage-provenance/artwork/{artwork_id}"
    criteria_list = [c.strip() for c in criteria.split(",")]
    rdf_service = request.app.state.rdf_service
    
    logger.info(f"Getting recommendations for {artwork_uri} with criteria: {criteria_list}")
    
    # 1. Fetch all artworks with necessary metadata for recommendations
    # We use a custom SPARQL query to get everything efficiently
    query = """
    PREFIX prov: <http://www.w3.org/ns/prov#>
    PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>
    
    SELECT ?artwork ?title ?imageURL ?artist ?artistName ?location ?locationName ?date ?typeLabel ?mediumLabel ?desc ?subjectLabel
    WHERE {
        ?artwork a prov:Entity ;
                 a crm:E22_Man_Made_Object .
        
        OPTIONAL { ?artwork crm:P102_has_title/crm:P190_has_symbolic_content ?title }
        OPTIONAL { ?artwork foaf:depiction ?imageURL }
        OPTIONAL { ?artwork crm:P3_has_note ?desc }
        
        OPTIONAL {
            ?event crm:P108_has_produced ?artwork .
            OPTIONAL { 
                ?event crm:P14_carried_out_by ?artist . 
                ?artist foaf:name ?artistName .
            }
            OPTIONAL { 
                ?event crm:P7_took_place_at ?location . 
                ?location rdfs:label ?locationName .
            }
            OPTIONAL { ?event crm:P4_has_time_span ?date }
        }
        
        OPTIONAL { ?artwork crm:P2_has_type/rdfs:label ?typeLabel }
        OPTIONAL { ?artwork crm:P45_consists_of/rdfs:label ?mediumLabel }
        OPTIONAL { ?artwork crm:P15_was_influenced_by/rdfs:label ?subjectLabel }
    }
    LIMIT 200
    """
    
    try:
        results = rdf_service.execute_sparql(query)
        all_artworks = []
        target_artwork = None
        
        for row in results:
            # Construct Artwork object
            artist_obj = None
            if row.artist:
                artist_obj = Agent(
                    uri=str(row.artist), 
                    name=str(row.artistName) if row.artistName else "Unknown",
                    type="Person"
                )
                
            location_obj = None
            if row.location:
                location_obj = Location(uri=str(row.location), name=str(row.locationName) if row.locationName else "Unknown")
            
            # Use the smart constructor to determine type from label
            type_obj = ArtworkType.from_text(str(row.typeLabel)) if row.typeLabel else ArtworkType.PAINTING

            artwork = Artwork(
                uri=str(row.artwork),
                title=str(row.title) if row.title else "Untitled",
                images=[str(row.imageURL)] if row.imageURL else [],
                artist=artist_obj,
                current_location=location_obj,
                creation_date=str(row.date) if row.date else None,
                artwork_type=type_obj,
                medium=str(row.mediumLabel) if row.mediumLabel else None,
                description=str(row.desc) if row.desc else None,
                romanian_heritage=True if "arp-greatteam.org" in str(row.artwork) else False
            )

            all_artworks.append(artwork)
            if artwork.uri == artwork_uri:
                target_artwork = artwork
        
        if not target_artwork:
            target_artwork_data = rdf_service.get_artwork(artwork_uri)

            if not target_artwork_data:
                return []

            artist_obj = None
            if target_artwork_data.get('artist'):
                artist_obj = Agent(
                    uri=str(target_artwork_data['artist'].get('uri')), 
                    name=str(target_artwork_data['artist'].get('name', "Unknown")),
                    type="Person"
                )
            
            location_obj = None
            if target_artwork_data.get('location'):
                location_obj = Location(
                    uri=str(target_artwork_data['location'].get('uri')),
                    name=str(target_artwork_data['location'].get('name', "Unknown"))
                )

            # Use the smart constructor for the target artwork as well
            type_obj = ArtworkType.from_text(target_artwork_data.get('type'))

            target_artwork = Artwork(
                uri=str(target_artwork_data.get('uri')),
                title=str(target_artwork_data.get('title', "Untitled")),
                title_ro=str(target_artwork_data.get('title')) if target_artwork_data.get('title') else None,
                artist=artist_obj,
                current_location=location_obj,
                creation_date=str(target_artwork_data.get('date')) if target_artwork_data.get('date') else None,
                artwork_type=type_obj,
                images=[str(target_artwork_data['imageURL'])] if target_artwork_data.get('imageURL') else [],
                medium=str(target_artwork_data['material']['label']) if target_artwork_data.get('material') else None,
                romanian_heritage=True
            )

        recommendations = recommendation_engine.generate_recommendations(
            target_artwork, all_artworks, max_results=max_results, criteria=criteria_list
        )
        
        return recommendations
        
    except Exception as e:
        logger.error(f"Error generating recommendations: {e}")
        return []


@router.get("/artist/{artist_id}", response_model=List[Recommendation])
async def get_recommendations_for_artist(
    artist_id: str,
    request: Request,
    max_results: int = Query(10, ge=1, le=50),
    criteria: str = Query("artist,period,location", description="Comma-separated criteria")
):
    """Get recommendations for a specific artist"""
    
    artist_uri = f"http://arp-greatteam.org/heritage-provenance/artist/{artist_id}"
    criteria_list = [c.strip() for c in criteria.split(",")]
    
    logger.info(f"Getting recommendations for {artist_uri} with criteria: {criteria_list}")
    
    return []