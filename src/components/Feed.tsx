import React, { useEffect, useState } from "react";
import Post from "./Post";
import SkeletonPost from "./SkeletonPost"; // Importa o skeleton
import { getAll } from "../Services/postService";
import "./Feed.css";

interface Post {
  id: number;
  Titulo: string;
  Descricao: string;
  imageUrl: string | null;
}

export default function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const response = await getAll();
        setTimeout(() => {
          if (response && Array.isArray(response)) {
            setPosts(response);
          }
          setLoading(false);
        }, 2000); // !!!!!!!!!!!!!Lembrar de tirar esse setTimeout quando subir pro servidor!!!!!!!!!!!!!!!
      } catch (error) {
        console.error("Erro ao buscar posts:", error);
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  return (
    <div className="feed-container">
      {loading ? (
        // Exibe skeletons enquanto está carregando
        <>
          <SkeletonPost />
          <SkeletonPost />
          <SkeletonPost />
        </>
      ) : (
        // Exibe os posts reais quando o carregamento é concluído
        <div className="feed-posts">
          {posts.map((post) => (
            <Post
              key={post.id}
              title={post.Titulo}
              imageUrl={post.imageUrl}
              description={post.Descricao}
            />
          ))}
        </div>
      )}
    </div>
  );
}
