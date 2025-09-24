import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, LayoutDashboard, Smartphone, Users } from 'lucide-react';

const Index: React.FC = () => {
  return (
    <div className="bg-gradient-to-b from-background via-background to-muted/40">
      <section className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 pb-24 pt-28 text-center">
        <span className="rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-xs uppercase tracking-[0.2em] text-primary">
          Loverlay
        </span>
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
          Создавайте атмосферные фотографии и управляйте каталогом оверлеев в одном месте
        </h1>
        <p className="max-w-2xl text-balance text-muted-foreground">
          Редактор Loverlay помогает блогерам, фотографам и маркетологам быстро превращать исходники в стильные публикации. Для
          бизнеса мы готовим мощную админ-панель, аналитику и личный кабинет с оплатой и историей покупок.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button size="lg" asChild>
            <Link to="/editor">Запустить редактор</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/account">Перейти в кабинет</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-4 pb-24 sm:grid-cols-2">
        <Card className="border-primary/20 bg-background/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <LayoutDashboard className="h-5 w-5 text-primary" />
              Для администраторов
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Управляйте наборами оверлеев, рубриками и доступностью контента для покупателей. Под рукой — метрики продаж, выгрузка
              отчётов и журнал действий.
            </p>
            <ul className="space-y-1">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" /> CRUD для категорий и наборов
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Аналитика использования и конверсии
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Управление файлами в пару кликов
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-background/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-primary" />
              Для клиентов
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Личный кабинет включает историю покупок, настройки оплаты и быстрый доступ к избранным наборам. Подписки и разовые
              покупки — в одном интерфейсе.
            </p>
            <ul className="space-y-1">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Поддержка карт и Apple/Google Pay
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" /> История заказов и квитанции
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Персональные рекомендации наборов
              </li>
            </ul>
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-16">
        <div className="grid gap-6 rounded-2xl border border-dashed border-primary/30 bg-background/70 px-6 py-8 sm:grid-cols-3">
          <div className="space-y-2">
            <Smartphone className="h-6 w-6 text-primary" />
            <h3 className="text-lg font-semibold">Адаптивность</h3>
            <p className="text-sm text-muted-foreground">
              Интерфейс редактора и навигации оптимизируется под экраны смартфонов — без горизонтального скролла и сложных жестов.
            </p>
          </div>
          <div className="space-y-2">
            <LayoutDashboard className="h-6 w-6 text-primary" />
            <h3 className="text-lg font-semibold">Фокус на данных</h3>
            <p className="text-sm text-muted-foreground">
              В админ-панели будут графики по конверсиям, выручке и популярности наборов с выгрузкой в CSV.
            </p>
          </div>
          <div className="space-y-2">
            <Users className="h-6 w-6 text-primary" />
            <h3 className="text-lg font-semibold">Совместное использование</h3>
            <p className="text-sm text-muted-foreground">
              Функция «Поделиться» позволит отправлять ссылку на результат клиенту или в соцсети прямо из редактора.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
