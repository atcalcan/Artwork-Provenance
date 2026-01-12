import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getArtworks } from '../api'
import { 
  UserIcon, 
  CalendarIcon, 
  MapPinIcon, 
  LinkIcon,
  ArrowLeftIcon,
  TagIcon
} from '@heroicons/react/24/outline'

const ArtistDetailsPage = () => {
  const { id } = useParams()

  // Fetch Artist Details
  const { data: artist, isLoading: artistLoading, error: artistError } = useQuery({
    queryKey: ['artist', id],
    queryFn: () => fetch(`http://localhost:8000/api/artists/${id}`).then(res => res.json())
  })

  // Fetch Artworks by Artist
  const { data: artworksData, isLoading: artworksLoading } = useQuery({
    queryKey: ['artistArtworks', id],
    queryFn: () => getArtworks({ artist_id: id, limit: 50 }).then(res => res.data)
  })

  if (artistLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        <p className="text-gray-400 mt-4">Loading artist profile...</p>
      </div>
    )
  }

  if (artistError || artist?.error) {
    return (
      <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 text-center">
        <p className="text-red-400">Error loading artist: {artistError?.message || artist?.error}</p>
        <Link to="/artworks" className="text-indigo-400 hover:text-indigo-300 mt-4 inline-block">
          &larr; Back to Collection
        </Link>
      </div>
    )
  }

  const wikiData = artist.wikidata_enrichment?.data || {}
  const artworks = artworksData?.artworks || []

  return (
    <div className="space-y-8" vocab="http://schema.org/" typeof={artist.type === 'Organization' ? 'Organization' : 'Person'} resource={artist.uri}>
      {/* Back Button */}
      <Link to="/artworks" className="text-gray-400 hover:text-white flex items-center space-x-2 group">
        <ArrowLeftIcon className="h-4 w-4 group-hover:-translate-x-1 transition" />
        <span>Back to Collection</span>
      </Link>

      {/* Artist Header / Profile */}
      <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700">
        <div className="md:flex">
          {/* Image Column */}
          <div className="md:w-1/3 lg:w-1/4 bg-gray-700 relative min-h-[300px]">
            {wikiData.image_url ? (
              <img 
                src={wikiData.image_url} 
                alt={artist.name} 
                className="w-full h-full object-cover absolute inset-0"
                property="image"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                <UserIcon className="h-24 w-24" />
              </div>
            )}
          </div>

          {/* Info Column */}
          <div className="p-8 md:w-2/3 lg:w-3/4 space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold text-white" property="name">{artist.name}</h1>
                {artist.type && (
                  <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs uppercase tracking-wider rounded border border-gray-600">
                    {artist.type}
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap gap-6 text-gray-300 mt-4">
                {(artist.birth_date || wikiData.birth_date) && (
                  <div className="flex items-center space-x-2">
                    <CalendarIcon className="h-5 w-5 text-indigo-400" />
                    <span>
                      <span property="birthDate">{artist.birth_date || wikiData.birth_date}</span> 
                      {' — '} 
                      {(artist.death_date || wikiData.death_date) ? (
                        <span property="deathDate">{artist.death_date || wikiData.death_date}</span>
                      ) : (
                        (artist.birth_date || wikiData.birth_date) ? 'Present' : '?'
                      )}
                    </span>
                  </div>
                )}
                {(artist.nationality || wikiData.nationality) && (
                  <div className="flex items-center space-x-2">
                    <MapPinIcon className="h-5 w-5 text-indigo-400" />
                    <span property="nationality">{artist.nationality || wikiData.nationality}</span>
                  </div>
                )}
              </div>
            </div>

            {wikiData.description && (
              <div className="prose prose-invert max-w-none border-t border-gray-700 pt-4">
                <p className="text-gray-300 leading-relaxed text-lg" property="description">
                  {wikiData.description}
                </p>
              </div>
            )}

            {/* External Links */}
            <div className="pt-4 border-t border-gray-700">
              <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center">
                <LinkIcon className="h-4 w-4 mr-2" />
                External Resources
              </h3>
              <div className="flex flex-wrap gap-3">
                {artist.wikidata_enrichment?.wikidata_id && (
                  <a 
                    href={`https://www.wikidata.org/wiki/${artist.wikidata_enrichment.wikidata_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-gray-700 hover:bg-indigo-600 rounded text-sm text-white transition flex items-center gap-2"
                    property="sameAs"
                  >
                    <img src="https://upload.wikimedia.org/wikipedia/commons/f/ff/Wikidata-logo.svg" className="w-4 h-4" alt="" />
                    Wikidata
                  </a>
                )}
                {artist.external_links?.map((link, idx) => (
                   <a 
                    key={idx}
                    href={link.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-gray-700 hover:bg-indigo-600 rounded text-sm text-white transition"
                    property="sameAs"
                  >
                    {link.source || 'External Link'}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Artworks Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-gray-700 pb-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <TagIcon className="h-6 w-6 text-indigo-500" />
            Artworks in Collection
          </h2>
          <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-sm font-medium">
            {artworks.length} works
          </span>
        </div>

        {artworksLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          </div>
        ) : artworks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {artworks.map((artwork) => (
              <Link
                key={artwork.uri}
                to={`/artworks/${artwork.uri.split('/').pop()}`}
                className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700 hover:border-indigo-500 transition group flex flex-col"
              >
                <div className="h-56 overflow-hidden bg-gray-700 relative">
                  {artwork.imageURL ? (
                    <img 
                      src={artwork.imageURL} 
                      alt={artwork.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">🎨</div>
                  )}
                  {artwork.romanian_heritage && (
                    <div className="absolute top-2 right-2 bg-indigo-600 text-white text-xs px-2 py-1 rounded shadow">
                      RO Heritage
                    </div>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="text-lg font-semibold text-white group-hover:text-indigo-400 transition line-clamp-2 mb-1">
                    {artwork.title}
                  </h3>
                  <div className="mt-auto pt-2">
                    <p className="text-sm text-gray-400 flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      {artwork.creation_date || 'Unknown date'}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300 border border-gray-600">
                        {artwork.artwork_type}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg p-12 text-center border border-gray-700 border-dashed">
            <p className="text-gray-400 text-lg">No artworks found for this artist in the collection.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ArtistDetailsPage