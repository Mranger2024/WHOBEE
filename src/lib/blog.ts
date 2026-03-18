import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const contentDir = path.join(process.cwd(), 'src', 'content', 'blog');

export interface BlogPost {
    slug: string;
    title: string;
    description: string;
    date: string;
    category: string;
    readTime: string;
    author: string;
    content: string;
}

export interface BlogPostMeta {
    slug: string;
    title: string;
    description: string;
    date: string;
    category: string;
    readTime: string;
    author: string;
}

export function getAllPosts(): BlogPostMeta[] {
    if (!fs.existsSync(contentDir)) return [];
    
    const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.mdx') || f.endsWith('.md'));
    
    const posts = files.map((filename) => {
        const slug = filename.replace(/\.mdx?$/, '');
        const filepath = path.join(contentDir, filename);
        const fileContents = fs.readFileSync(filepath, 'utf8');
        const { data } = matter(fileContents);
        
        return {
            slug,
            title: data.title || 'Untitled',
            description: data.description || '',
            date: data.date || '',
            category: data.category || 'General',
            readTime: data.readTime || '5 min read',
            author: data.author || 'WHOBEE Team',
        };
    });
    
    // Sort by date, newest first
    return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostBySlug(slug: string): BlogPost | null {
    const extensions = ['.mdx', '.md'];
    
    for (const ext of extensions) {
        const filepath = path.join(contentDir, `${slug}${ext}`);
        if (fs.existsSync(filepath)) {
            const fileContents = fs.readFileSync(filepath, 'utf8');
            const { data, content } = matter(fileContents);
            
            return {
                slug,
                title: data.title || 'Untitled',
                description: data.description || '',
                date: data.date || '',
                category: data.category || 'General',
                readTime: data.readTime || '5 min read',
                author: data.author || 'WHOBEE Team',
                content,
            };
        }
    }
    
    return null;
}

export function getPostSlugs(): string[] {
    if (!fs.existsSync(contentDir)) return [];
    return fs
        .readdirSync(contentDir)
        .filter(f => f.endsWith('.mdx') || f.endsWith('.md'))
        .map(f => f.replace(/\.mdx?$/, ''));
}
