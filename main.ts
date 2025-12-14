// Создаём новые SpriteKind для пуль
namespace SpriteKind {
    export const PlayerProjectile = SpriteKind.create()
    export const EnemyProjectile = SpriteKind.create()
}

let player: Sprite = null
let score = 0
let lives = 3

// Стартовая платформа под игроком
let startPlatform = sprites.create(img`
    8 8 8 8 8 8 8 8
`, SpriteKind.Food)
startPlatform.setPosition(80, 120)

// Игрок
player = sprites.create(img`
    . . f f f f . .
    . f f f f f f .
    f f f f f f f f
    f f f f f f f f
    f f f f f f f f
    . f f f f f f .
    . . f f f f . .
`, SpriteKind.Player)
player.setPosition(80, 100)
player.ay = 350
controller.moveSprite(player, 100, 0)
scene.cameraFollowSprite(player)
scene.setBackgroundColor(9)

// Инициализация
score = 0
info.setScore(score)
lives = 3
info.setLife(lives)

// Функция создания платформ с шансом на бонус
function createRandomPlatform(x: number, y: number) {
    let p: Sprite
    let r = randint(0, 25)
    if (r == 0) {
        // Батут — оранжевый
        p = sprites.create(img`
            . 7 7 7 7 7 7 7 .
        `, SpriteKind.Food)
        p.data = "trampoline"
    } else if (r == 1) {
        // Хилка — красная
        p = sprites.create(img`
            . 2 2 2 2 2 2 2 .
        `, SpriteKind.Food)
        p.data = "heal"
    } else if (r == 2) {
        // Ломающаяся платформа — белая пунктирная
        p = sprites.create(img`
            15 . 15 . 15 . 15 .
        `, SpriteKind.Food)
        p.data = "breakable"
    } else {
        // Обычная платформа — серая сплошная
        p = sprites.create(img`
            8 8 8 8 8 8 8 8
        `, SpriteKind.Food)
        p.data = "normal"
    }
    p.setPosition(x, y)
}

// Стартовые платформы
for (let i = 0; i < 7; i++) {
    createRandomPlatform(randint(20, 140), i * 20 + 40)
}

// Стрельба игрока вверх
controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
    let proj = sprites.createProjectileFromSprite(img`
        . 2 .
        2 2 2
        . 2 .
    `, player, 0, -100)
    proj.setKind(SpriteKind.PlayerProjectile)
})

// Функция создания врага сверху
function spawnEnemy() {
    let e = sprites.create(img`
        . f f f .
        f f f f f
        f f f f f
        . f f f .
    `, SpriteKind.Enemy)
    e.setPosition(randint(20, 140), 0)
    e.vy = 10
}

// Генерация врагов каждые 2 секунды
game.onUpdateInterval(2000, function () {
    spawnEnemy()
})

// Враги стреляют вниз каждые 1.5 секунды
game.onUpdateInterval(1500, function () {
    for (let e of sprites.allOfKind(SpriteKind.Enemy)) {
        let bullet = sprites.createProjectileFromSprite(img`
            . 3 .
            3 3 3
            . 3 .
        `, e, 0, 80)
        bullet.setKind(SpriteKind.EnemyProjectile)
    }
})

// Игровой цикл
game.onUpdate(function () {
    // Ограничение по бокам
    if (player.x < 8) player.x = 8
    if (player.x > 152) player.x = 152

    // Прыжки на платформах
    if (player.vy > 0) {
        for (let p of sprites.allOfKind(SpriteKind.Food)) {
            if (player.overlapsWith(p)) {
                // Батут
                if (p.data == "trampoline") {
                    player.vy = -350
                } else {
                    // Обычные и ломающиеся платформы
                    player.vy = -200
                }

                // Хилка
                if (p.data == "heal") {
                    info.changeLifeBy(1)
                    p.destroy()
                }

                // Ломающаяся платформа
                if (p.data == "breakable") {
                    p.destroy()  // исчезает после одного прыжка
                }
            }
        }
    }

    // Скроллинг вверх
    if (player.y < 60) {
        let diff = 60 - player.y
        player.y = 60
        for (let p of sprites.allOfKind(SpriteKind.Food)) {
            p.y += diff
            if (p.y > 160) {
                p.destroy()
                createRandomPlatform(randint(20, 140), 0)
            }
        }
        for (let e of sprites.allOfKind(SpriteKind.Enemy)) {
            e.y += diff
            if (e.y > 160) e.destroy()
        }
        score += diff
        info.setScore(score)
    }

    // Столкновение игрока с врагами
    for (let e of sprites.allOfKind(SpriteKind.Enemy)) {
        if (player.overlapsWith(e)) {
            e.destroy()
            info.changeLifeBy(-1)
            if (info.life() <= 0) game.over(false, effects.dissolve)
        }
    }

    // Столкновение игрока с пулями врагов
    for (let b of sprites.allOfKind(SpriteKind.EnemyProjectile)) {
        if (player.overlapsWith(b)) {
            b.destroy()
            info.changeLifeBy(-1)
            if (info.life() <= 0) game.over(false, effects.dissolve)
        }
    }

    // Столкновение пули игрока с врагами
    for (let b of sprites.allOfKind(SpriteKind.PlayerProjectile)) {
        for (let e of sprites.allOfKind(SpriteKind.Enemy)) {
            if (b.overlapsWith(e)) {
                e.destroy()
                b.destroy()
                score += 50
                info.setScore(score)
            }
        }
    }

    // Смерть игрока при падении
    if (player.y > 160) game.over(false, effects.dissolve)
})
