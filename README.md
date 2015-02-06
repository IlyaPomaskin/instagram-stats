# instagram-stats
Библиотека для подсчета статистики в Instagram

### Пример использования
``` 
var accumStats = {};
var statsMiner = new StatsMiner({
    paginationField: 'max_id',
    fetchFunction: Instagram.user.media.bind(Instagram, 3),
    statsCallback: function (stat) {
        accumStats = statsMiner.calculateTotal(stats, accumStats);
        console.log('Current stats', stats);
        console.log('Total stats', accumStats);
    }
});
```
### Опции
```
var statsMiner = new StatsMiner({
    // Поле для пагинации в ответе Instagram 
    // (Обязательный параметр)
    paginationField: 'max_id', 
    // Функция для запроса фотографий. Должна принимать два параметра: параметры запроса options и функцию callback 
    // (Обязательный параметр)
    fetchFunction: function(options, callback) {
        options = options || {};
        JSONP('http://api.instagram.com/some/endpoint', options, callback);
    }, 
    // Параметры добавляемые к каждому запросу Instagram
    fetchFunctionOptions: {
        count: 100 // Например кол-во фотографий
    },
    // Таймаут между запросами
    requestTimeout: 3 * 1000,
    // Функция вызываемая если Instagram ответил ошибкой.
    errorCallback: function (response) {
        console.log(response.meta);
    },
    // Функция вызываемся после подсчета статистики для новой порции данных
    statsCallback: function (stats) {
        accumStats = statsMiner.calculateTotal(stats, accumStats);
        console.log('Current stats', stats);
        console.log('Total stats', accumStats);
    },
    // Вызывается при остановке получения фотографий
    stopCallback: function (isFinished) {
        console.log(isFinished ? 'No more photos' : 'Stopped by user');
    },
    // Пользовательские функции для подсчета статистики
    statsFunctions: {
        'mostTaggedPhoto': function (mediaArray){
            return _.max(mediaArray, function (media) {
                return media.tags.length;
            })
        }
    },
    // Пользовательские функции вызываемые при StatsMiner.calculateTotal(stats, accum)
    unionFunctions: {
        'mostTaggedPhoto': function (accumStatsValue, statsValue) {
            return _.max([accumStatsValue, statsValue], function (media) {
                return media && media.tags && media.tags.length;
            });
        }
    }
});
 ```

### Методы
Запуск майнера
```
statsMiner.start()
```

Остановка майнера
```
statsMiner.start()
```

Подсчет общей статистики. Принимает два объекта:   
stats - данные которые нужно добавить  
accum - посчитанные до этого данные  
Для каждого элемента в объекте stats будет вызвана функция из unionFunctions. Если такой функции нет, будет вызвана функция которая сложит два числовых значения или если передан объект, попытается сложить все числовые значения объекта.  
Возвращает новый объект с посчитанными значениями.
```
statsMiner.calculateTotal(stats, accum)
```

### Дополнительно

Зависит от lodash.  
Использует CommonJS.  
Для примера из index.html требуется установить Instajam и Bootstrap. После этого собрать с помощью ```gulp dist```
