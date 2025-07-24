import { useState } from 'react'
import { Search, Menu, Github, ExternalLink, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ModeToggle } from "@/components/mode-toggle"

// Type definitions for your project data
interface Project {
  _id: string
  title: string
  caption: string
  chunk_text: string
  url: string
  videoLink?: string
  techUsed: string[]
  externalLinks: string[]
  hackathon: string
}

interface SearchResponse {
  projects: Project[]
  message?: string
}

function App() {
  const [searchQuery, setSearchQuery] = useState("")
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  const API_URL = "https://sx968xp9de.execute-api.us-east-1.amazonaws.com/prod/search"

  // Clean API function that fixes CORS errors
  const searchProjectsAPI = async (query: string) => {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API error ${res.status}: ${text}`);
    }

    return (await res.json()) as SearchResponse;
  }

  // Function to search projects with state management
  const searchProjects = async (query: string) => {
    if (!query.trim()) {
      setError("Please enter a search term")
      return
    }

    setLoading(true)
    setError(null)
    setHasSearched(true)

    try {
      const data = await searchProjectsAPI(query.trim())
      
      if (data.projects && Array.isArray(data.projects)) {
        setProjects(data.projects)
      } else {
        setProjects([])
        setError('No projects found in response')
      }
    } catch (err) {
      console.error('Search error:', err)
      setError(err instanceof Error ? err.message : 'Failed to search projects')
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    searchProjects(searchQuery)
  }

  // Handle search button click
  const handleSearchClick = () => {
    searchProjects(searchQuery)
  }

  const formatHackathonName = (hackathon: string) => {
    // Convert hackathon slugs to readable names
    const hackathonNames: { [key: string]: string } = {
      'responsibleai': 'Responsible AI Hackathon',
      'climatechange2023': 'Climate Change Hackathon 2023',
      'edtech2023': 'EdTech Innovation 2023',
      'healthtech': 'HealthTech Innovation',
      'fintech': 'FinTech Challenge',
      'sustainability': 'Sustainability Hackathon'
    }
    return hackathonNames[hackathon] || hackathon.charAt(0).toUpperCase() + hackathon.slice(1)
  }

  const formatTechName = (tech: string) => {
    // Clean up and format technology names
    return tech
      .replace(/-/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      {/* Header */}
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <div className="flex items-center gap-2 text-lg font-semibold md:text-base">
            <Search className="h-6 w-6" />
            <span className="font-bold text-2xl">HackRAG</span>
          </div>
        </nav>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 md:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <nav className="grid gap-6 text-lg font-medium">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Search className="h-6 w-6" />
                <span className="font-bold text-2xl">HackRAG</span>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <div className="ml-auto flex-1 sm:flex-initial">
            <ModeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 space-y-8 p-4 md:p-8">
        {/* Hero Section */}
        <div className="flex flex-col items-center space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
              Find Your Next
              <span className="text-primary"> Hackathon Project</span>
            </h1>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
              Search through a curated database of winning hackathon projects to get inspired for your next innovation.
            </p>
          </div>

          {/* Search Bar */}
          <div className="w-full max-w-2xl space-y-2">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search projects by name, technology, or description..."
                  className="pl-10 h-12 text-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={loading}
                />
              </div>
              <Button 
                type="submit" 
                size="lg" 
                disabled={loading || !searchQuery.trim()}
                onClick={handleSearchClick}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                <span className="ml-2">Search</span>
              </Button>
            </form>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Try searching for "AI", "React", "Healthcare", or any technology you're interested in
            </p>
          </div>
        </div>

        {/* Results Section */}
        {(hasSearched || loading) && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                {loading ? 'Searching...' : `Search Results (${projects.length})`}
              </h2>
            </div>

            {/* Error State */}
            {error && (
              <div className="text-center py-12">
                <h3 className="text-lg font-semibold mb-2 text-red-600 dark:text-red-400">
                  Search Error
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-2xl mx-auto">
                  {error}
                </p>
                {error.includes('CORS') && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4 max-w-2xl mx-auto">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <strong>Note:</strong> The API endpoint needs to be configured to allow requests from this domain. 
                      This is a common issue in development and can be resolved by updating the CORS settings on the backend.
                    </p>
                  </div>
                )}
                <Button 
                  onClick={() => searchProjects(searchQuery)}
                  variant="outline"
                >
                  Try Again
                </Button>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  Searching hackathon projects...
                </p>
              </div>
            )}

            {/* Project Cards */}
            {!loading && !error && projects.length > 0 && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                  <Card key={project._id} className="flex flex-col">
                    <CardHeader>
                      <div className="space-y-2">
                        <CardTitle className="text-xl">{project.title}</CardTitle>
                        <CardDescription className="text-sm font-medium text-primary">
                          {formatHackathonName(project.hackathon)}
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {project.caption}
                      </p>
                      
                      {/* Technology Tags */}
                      {project.techUsed && project.techUsed.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            Technologies
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {project.techUsed.slice(0, 6).map((tech) => (
                              <Badge key={tech} variant="outline" className="text-xs">
                                {formatTechName(tech)}
                              </Badge>
                            ))}
                            {project.techUsed.length > 6 && (
                              <Badge variant="outline" className="text-xs">
                                +{project.techUsed.length - 6} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2 pt-4">
                        {/* Main Devpost Link */}
                        <Button size="sm" asChild className="w-full">
                          <a href={project.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View on Devpost
                          </a>
                        </Button>
                        
                        {/* External Links */}
                        {project.externalLinks && project.externalLinks.length > 0 && (
                          <div className="flex gap-2">
                            {project.externalLinks.map((link, index) => {
                              const isGithub = link.includes('github.com')
                              const isDrive = link.includes('drive.google.com')
                              const isYoutube = link.includes('youtube.com') || link.includes('youtu.be')
                              
                              let linkText = 'Link'
                              let icon = <ExternalLink className="h-4 w-4" />
                              
                              if (isGithub) {
                                linkText = 'GitHub'
                                icon = <Github className="h-4 w-4" />
                              } else if (isDrive) {
                                linkText = 'Drive'
                              } else if (isYoutube) {
                                linkText = 'Demo'
                              }
                              
                              return (
                                <Button
                                  key={index}
                                  size="sm"
                                  variant="outline"
                                  asChild
                                  className="flex-1"
                                >
                                  <a href={link} target="_blank" rel="noopener noreferrer">
                                    {icon}
                                    <span className="ml-1 text-xs">{linkText}</span>
                                  </a>
                                </Button>
                              )
                            })}
                          </div>
                        )}

                        {/* Video Link if available */}
                        {project.videoLink && (
                          <Button size="sm" variant="outline" asChild className="w-full">
                            <a href={project.videoLink} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Watch Video
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* No Results State */}
            {!loading && !error && hasSearched && projects.length === 0 && (
              <div className="text-center py-12">
                <h3 className="text-lg font-semibold mb-2">No projects found</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Try adjusting your search terms or using different keywords.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Welcome State */}
        {!hasSearched && !loading && (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">Ready to discover amazing projects?</h3>
            <p className="text-gray-500 dark:text-gray-400">
              Enter your search terms above and click the Search button to find relevant hackathon projects.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center justify-center gap-4 py-10 md:h-24 md:py-0">
          <div className="flex items-center gap-2">
            <Search className="h-6 w-6" />
            <p className="text-center text-sm leading-loose">
              Built with ❤️ for hackathon enthusiasts. Discover, learn, and build amazing projects.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
