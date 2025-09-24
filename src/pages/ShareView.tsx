import React from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockApi } from '@/lib/mockApi';
import type { SharedRender } from '@/lib/types';
import { decompressFromEncodedURIComponent } from 'lz-string';

const ShareView: React.FC = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const [searchParams] = useSearchParams();
  const encodedData = searchParams.get('data');
  const inlineTitle = searchParams.get('title') ?? undefined;

  const inlineShare = React.useMemo<Pick<SharedRender, 'imageData' | 'title'> | null>(() => {
    if (!encodedData) return null;
    try {
      const decoded = decompressFromEncodedURIComponent(encodedData);
      if (!decoded) return null;
      return { imageData: decoded, title: inlineTitle };
    } catch (error) {
      console.warn('Не удалось декодировать встроенные данные публикации', error);
      return null;
    }
  }, [encodedData, inlineTitle]);

  const shareQuery = useQuery({
    queryKey: ['share', shareId],
    queryFn: () => mockApi.getShare(shareId || ''),
    enabled: Boolean(shareId) && !inlineShare,
  });

  if (!shareId && !inlineShare) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-4">
        <Card className="w-full border-dashed text-center">
          <CardHeader>
            <CardTitle>Ссылка недействительна</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Не удалось определить идентификатор публикации.</p>
            <Button asChild className="mt-4">
              <Link to="/editor">Перейти в редактор</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!inlineShare && shareQuery.isLoading) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-4">
        <p className="text-sm text-muted-foreground">Загружаем публикацию…</p>
      </div>
    );
  }

  if (!inlineShare && (shareQuery.isError || !shareQuery.data)) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-4">
        <Card className="w-full border-dashed text-center">
          <CardHeader>
            <CardTitle>Публикация не найдена</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Ссылка могла устареть или быть удалена.</p>
            <Button asChild>
              <Link to="/editor">Создать свою работу</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const share = inlineShare ?? shareQuery.data;

  if (!share) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-4">
        <Card className="w-full border-dashed text-center">
          <CardHeader>
            <CardTitle>Публикация не найдена</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Ссылка могла устареть или быть удалена.</p>
            <Button asChild>
              <Link to="/editor">Создать свою работу</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-5xl flex-col gap-6 px-4 pb-16 pt-10">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Готовый результат</h1>
        <p className="text-muted-foreground">
          Изображение сохранено пользователем Loverlay. Скопируйте ссылку или создайте собственный дизайн в редакторе.
        </p>
      </div>
      <div className="flex flex-col items-center gap-4">
        <div className="w-full max-w-3xl overflow-hidden rounded-xl border border-border bg-background shadow-lg">
          <img src={share.imageData} alt={share.title ?? 'Опубликованный результат'} className="w-full" />
        </div>
        {share.title && <p className="text-sm text-muted-foreground">{share.title}</p>}
        <Button asChild>
          <Link to="/editor">Открыть редактор</Link>
        </Button>
      </div>
    </div>
  );
};

export default ShareView;
