import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { FolderKanban, Users, Calendar } from "lucide-react"

interface ProjectCardProps {
  project: {
    id: number
    name: string
    description: string | null
    version: string | null
    status: string
    created_at: string
    creator_name?: string
  }
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">{project.name}</CardTitle>
            </div>
            <Badge variant={project.status === "active" ? "default" : "secondary"} className="capitalize">
              {project.status}
            </Badge>
          </div>
          {project.description && <CardDescription className="line-clamp-2">{project.description}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-2">
          {project.version && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium">Version:</span>
              <span>{project.version}</span>
            </div>
          )}
          {project.creator_name && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Created by {project.creator_name}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{new Date(project.created_at).toLocaleDateString()}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
