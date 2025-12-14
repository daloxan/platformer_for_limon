player: Sprite = None
score = 0
lives = 3
# Стартовая платформа под игроком
startPlatform = sprites.create(img("""
    8 8 8 8 8 8 8 8
    """), SpriteKind.food)
startPlatform.set_position(80, 120)
# Игрок
player = sprites.create(img("""
        . . f f f f . .
        . f f f f f f .
        f f f f f f f f
        f f f f f f f f
        f f f f f f f f
        . f f f f f f .
        . . f f f f . .
        """),
    SpriteKind.player)
player.set_position(80, 100)
player.ay = 350
controller.move_sprite(player, 100, 0)
scene.camera_follow_sprite(player)
scene.set_background_color(9)
# Инициализация
score = 0
info.set_score(score)
lives = 3
info.set_life(lives)
# Функция создания платформ с шансом на бонус
def createRandomPlatform(x: number, y: number):
    r = randint(0, 20)
    if r == 0:
        p = sprites.create(img("""
            . 4 4 4 4 4 4 4 .
            """), SpriteKind.food)
        p.data = "trampoline"
    elif r == 1:
        p = sprites.create(img("""
            . 6 6 6 6 6 6 6 .
            """), SpriteKind.food)
        p.data = "heal"
    else:
        p = sprites.create(img("""
            8 8 8 8 8 8 8 8
            """), SpriteKind.food)
        p.data = "normal"
    p.set_position(x, y)
# Стартовые платформы
for i in range(7):
    createRandomPlatform(randint(20, 140), i * 20 + 40)
# Стрельба игрока вверх

def on_a_pressed():
    sprites.create_projectile_from_sprite(img("""
            . 2 .
            2 2 2
            . 2 .
            """),
        player,
        0,
        -100)
controller.A.on_event(ControllerButtonEvent.PRESSED, on_a_pressed)

# Функция создания врага сверху
def spawnEnemy():
    e = sprites.create(img("""
            . f f f .
            f f f f f
            f f f f f
            . f f f .
            """),
        SpriteKind.enemy)
    e.set_position(randint(20, 140), 0)
    e.vy = 10
# Генерация врагов каждые 2 секунды

def on_update_interval():
    spawnEnemy()
game.on_update_interval(2000, on_update_interval)

# Враги стреляют вниз каждые 1.5 секунды

def on_update_interval2():
    for f in sprites.all_of_kind(SpriteKind.enemy):
        sprites.create_projectile_from_sprite(img("""
            . 3 .
            3 3 3
            . 3 .
            """), f, 0, 80)
game.on_update_interval(1500, on_update_interval2)

# Игровой цикл

def on_on_update():
    global score
    # Ограничение по бокам
    if player.x < 8:
        player.x = 8
    if player.x > 152:
        player.x = 152
    # Прыжки на платформах
    if player.vy > 0:
        for q in sprites.all_of_kind(SpriteKind.food):
            if player.overlaps_with(q):
                if q.data == "trampoline":
                    player.vy = -350
                else:
                    player.vy = -200
                if q.data == "heal":
                    info.change_life_by(1)
                    q.destroy()
    # Скроллинг вверх
    if player.y < 60:
        diff = 60 - player.y
        player.y = 60
        for s in sprites.all_of_kind(SpriteKind.food):
            s.y += diff
            if s.y > 160:
                s.destroy()
                createRandomPlatform(randint(20, 140), 0)
        for g in sprites.all_of_kind(SpriteKind.enemy):
            g.y += diff
            if g.y > 160:
                g.destroy()
        score += diff
        info.set_score(score)
    # Столкновение игрока с врагами
    for h in sprites.all_of_kind(SpriteKind.enemy):
        if player.overlaps_with(h):
            h.destroy()
            info.change_life_by(-1)
            if info.life() <= 0:
                game.over(False, effects.dissolve)
    # Столкновение игрока с пулями врагов
    for t in sprites.all_of_kind(SpriteKind.projectile):
        if t.vy > 0 and player.overlaps_with(t):
            t.destroy()
            info.change_life_by(-1)
            if info.life() <= 0:
                game.over(False, effects.dissolve)
    # Столкновение пули игрока с врагами
    for b in sprites.all_of_kind(SpriteKind.projectile):
        for j in sprites.all_of_kind(SpriteKind.enemy):
            if b.overlaps_with(j):
                j.destroy()
                b.destroy()
                score += 50
                info.set_score(score)
    # Смерть игрока при падении
    if player.y > 160:
        game.over(False, effects.dissolve)
game.on_update(on_on_update)
