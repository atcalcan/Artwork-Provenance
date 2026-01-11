import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getArtwork, getRecommendations } from '../api'
import { 
  MapPinIcon, 
  CalendarIcon, 
  UserIcon, 
  TagIcon,
  InformationCircleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'

const ArtworkDetailPage = () => {
  const { id } = useParams()

  const { data: artwork, isLoading: artworkLoading, error: artworkError } = useQuery({
    queryKey: ['artwork', id],
    queryFn: () => getArtwork(id).then(res => res.data)
  })

  const { data: recommendations, isLoading: recsLoading } = useQuery({
    queryKey: ['recommendations', id],
    queryFn: () => getRecommendations(id).then(res => res.data),
    enabled: !!id
  })

  if (artworkLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        <p className="text-gray-400 mt-4">Loading artwork details...</p>
      </div>
    )
  }

  if (artworkError) {
    return (
      <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 text-center">
        <p className="text-red-400">Error loading artwork: {artworkError.message}</p>
        <Link to="/artworks" className="text-indigo-400 hover:text-indigo-300 mt-4 inline-block">
          &larr; Back to Artworks
        </Link>
      </div>
    )
  }

  if (!artwork) return null

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <Link to="/artworks" className="text-gray-400 hover:text-white flex items-center space-x-2 group">
        <ArrowLeftIcon className="h-4 w-4 group-hover:-translate-x-1 transition" />
        <span>Back to Collection</span>
      </Link>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Section */}
        <div className="space-y-4">
          <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700">
            {artwork.imageURL ? (
              <img src={artwork.imageURL} alt={artwork.title} className="w-full h-auto object-cover" />
            ) : (
              <div className="h-96 bg-gray-700 flex items-center justify-center">
                <span className="text-6xl">🎨</span>
              </div>
            )}
          </div>
        </div>

        {/* Details Section */}
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-white">{artwork.title}</h1>
            {artwork.title_ro && (
              <p className="text-xl text-gray-400 mt-2 italic">{artwork.title_ro}</p>
            )}
          </div>

          <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700 space-y-4">
            <div className="flex items-center space-x-3 text-gray-300">
              <UserIcon className="h-5 w-5 text-indigo-400" />
              <span className="font-medium">Artist:</span>
              <span>{artwork.artist?.name || 'Unknown'}</span>
            </div>
            
            <div className="flex items-center space-x-3 text-gray-300">
              <CalendarIcon className="h-5 w-5 text-indigo-400" />
              <span className="font-medium">Date:</span>
              <span>{artwork.creation_date || 'Unknown'}</span>
            </div>

            <div className="flex items-center space-x-3 text-gray-300">
              <TagIcon className="h-5 w-5 text-indigo-400" />
              <span className="font-medium">Type:</span>
              <span>{artwork.artwork_type || 'Unknown'}</span>
            </div>

            <div className="flex items-center space-x-3 text-gray-300">
              <MapPinIcon className="h-5 w-5 text-indigo-400" />
              <span className="font-medium">Location:</span>
              <span>{artwork.current_location?.name || 'Unknown'}</span>
            </div>

            {artwork.medium && (
              <div className="flex items-start space-x-3 text-gray-300">
                <InformationCircleIcon className="h-5 w-5 text-indigo-400 mt-1" />
                <div>
                  <span className="font-medium">Medium:</span>
                  <p className="mt-1 text-gray-400">{artwork.medium}</p>
                </div>
              </div>
            )}

            {artwork.description && (
              <div className="pt-4 border-t border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
                <p className="text-gray-400 leading-relaxed">{artwork.description}</p>
              </div>
            )}
          </div>
          
          {/* Provenance Link */}
           <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-2">Provenance</h3>
            <p className="text-gray-400 mb-4">
              {artwork.provenance_chain 
                ? `${artwork.provenance_chain.length} recorded events in history.` 
                : 'No provenance data available.'}
            </p>
            <Link 
              to={`/provenance/${id}`}
              className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              View Full Provenance Chain
            </Link>
          </div>
        </div>
      </div>

      {/* Recommendations Section */}
      <div className="pt-8 border-t border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-6">Similar Artworks</h2>
        
        {recsLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          </div>
        ) : recommendations && recommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendations.map((rec) => (
              <Link
                key={rec.artwork.uri}
                to={`/artworks/${rec.artwork.uri.split('/').pop()}`}
                className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700 hover:border-indigo-500 transition group flex flex-col"
              >
                <div className="relative h-48">
                  {rec.artwork.images && rec.artwork.images.length > 0 ? (
                    <img src={rec.artwork.images[0]} alt={rec.artwork.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                      <span className="text-4xl">🎨</span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-xs text-white">
                    {(rec.similarity_score * 100).toFixed(0)}% Match
                  </div>
                </div>
                
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="text-sm font-semibold text-white group-hover:text-indigo-400 transition line-clamp-2">
                    {rec.artwork.title}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">{rec.artwork.artist?.name}</p>
                  
                  {rec.reasons && rec.reasons.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <p className="text-xs text-gray-500 mb-1">Why similar:</p>
                      <ul className="text-xs text-gray-400 list-disc list-inside">
                        {rec.reasons.slice(0, 2).map((reason, idx) => (
                          <li key={idx} className="truncate">{reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No similar artworks found.</p>
        )}
      </div>
    </div>
  )
}

export default ArtworkDetailPage
