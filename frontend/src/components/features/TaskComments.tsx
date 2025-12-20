import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Send, Edit2, Trash2, Reply } from "lucide-react";
import { commentsApi } from "@/api/comments";
import { Comment } from "@/types";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Avatar } from "@/components/ui/Avatar";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { useAuthStore } from "@/stores/authStore";

interface TaskCommentsProps {
  taskId: number;
}

function TaskComments({ taskId }: TaskCommentsProps) {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["task-comments", taskId],
    queryFn: () => commentsApi.getTaskComments(taskId),
  });

  const createMutation = useMutation({
    mutationFn: ({ content, parentId }: { content: string; parentId?: number }) =>
      commentsApi.createComment(taskId, content, parentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-comments", taskId] });
      setNewComment("");
      setReplyContent("");
      setReplyingTo(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, content }: { id: number; content: string }) =>
      commentsApi.updateComment(id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-comments", taskId] });
      setEditingId(null);
      setEditContent("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: commentsApi.deleteComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-comments", taskId] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      createMutation.mutate({ content: newComment });
    }
  };

  const handleReply = (parentId: number) => {
    if (replyContent.trim()) {
      createMutation.mutate({ content: replyContent, parentId });
    }
  };

  const handleEdit = (commentId: number) => {
    if (editContent.trim()) {
      updateMutation.mutate({ id: commentId, content: editContent });
    }
  };

  const renderComment = (comment: Comment, isReply = false) => {
    const isEditing = editingId === comment.id;
    const isReplying = replyingTo === comment.id;
    const isAuthor = currentUser?.id === comment.user_id;

    return (
      <div
        key={comment.id}
        className={`flex gap-3 ${isReply ? "ml-12 mt-3" : "mt-4"}`}
      >
        <Avatar
          src={comment.user?.avatar}
          fallback={`${comment.user?.first_name?.[0] || ""}${comment.user?.last_name?.[0] || ""}`}
          size="sm"
        />
        <div className="flex-1 space-y-2">
          <div className="bg-muted rounded-lg p-3">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div>
                <span className="font-medium text-sm">
                  {comment.user?.first_name} {comment.user?.last_name}
                </span>
                <span className="text-xs text-muted-foreground ml-2">
                  {formatDistanceToNow(new Date(comment.created_at), {
                    addSuffix: true,
                    locale: ru,
                  })}
                </span>
              </div>
              {isAuthor && (
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setEditingId(comment.id);
                      setEditContent(comment.content);
                    }}
                    className="p-1 hover:bg-accent rounded"
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(comment.id)}
                    className="p-1 hover:bg-destructive/10 text-destructive rounded"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[60px]"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleEdit(comment.id)}
                    disabled={updateMutation.isPending}
                  >
                    Сохранить
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingId(null);
                      setEditContent("");
                    }}
                  >
                    Отмена
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
            )}
          </div>

          {!isReply && (
            <button
              onClick={() => setReplyingTo(comment.id)}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <Reply className="h-3 w-3" />
              Ответить
            </button>
          )}

          {isReplying && (
            <div className="ml-4 space-y-2">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Ваш ответ..."
                className="min-h-[60px]"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleReply(comment.id)}
                  disabled={createMutation.isPending}
                >
                  <Send className="h-3 w-3 mr-1" />
                  Отправить
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyContent("");
                  }}
                >
                  Отмена
                </Button>
              </div>
            </div>
          )}

          {/* Вложенные ответы */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="space-y-2">
              {comment.replies.map((reply) => renderComment(reply, true))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        <h3 className="font-semibold">Комментарии ({comments.length})</h3>
      </div>

      {/* Форма нового комментария */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Добавьте комментарий... (используйте @username для упоминания)"
          className="min-h-[80px]"
        />
        <Button
          type="submit"
          disabled={!newComment.trim() || createMutation.isPending}
        >
          <Send className="h-4 w-4 mr-2" />
          Отправить
        </Button>
      </form>

      {/* Список комментариев */}
      {isLoading ? (
        <p className="text-center text-muted-foreground py-4">Загрузка...</p>
      ) : comments.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          Комментариев пока нет. Будьте первым!
        </p>
      ) : (
        <div className="space-y-2">
          {comments
            .filter((c) => !c.parent_id) 
            .map((comment) => renderComment(comment))}
        </div>
      )}
    </div>
  );
}

export { TaskComments };
