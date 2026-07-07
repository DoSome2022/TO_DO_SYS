10/3/2026

現在差edit user 以及 user 顯示Position 以及Permission 就應該完成USER 管理部份(要處理DynamicFeature)

13/3/2026

暫時完成了PM 部份的project 位置

現在去做admin 部份的裝備 CRUD



29/5/2026

設備做了數據加入 明天再做測試


6/4/2026

客人的client side 完成 差是測試，要再加商品部份才是一環才是一個閉環系統


8/4/2026
已做完 admin 的服務 以及 公司 logo 自選


11/4/2026

sales 看不到 客人的信息// 已經解決問題

13/4/2026

現在要做PM 的項目 以及 有關 PM以及 員工 的todo 列表


15/4/2026

員工要在todo list 中 的該任務加入 要使用的裝B 以及 該任務甚麼時間做，以及要有上傳文件功能 要分版本的，還有項目內的小組對話群 還有自定todo list
明天要試 是否能顯示裝備在todo list 中(員工) 以已做了generate 以及 push db 

16/4/2026

已完成員工要在todo list 中 的該任務加入 要使用的裝B 以及 該任務甚麼時間做 以及 測試
已做了還有項目內的小組對話群 以及分版本的對話


18/4/2026
 staff 頁面基本完成（包function)
 在考慮上傳速度問題

20/4/2026

pm的已納入的員工產出 有del ,要加入function
已納入的員工產出中的文檔匯給客人 要想想有甚麼法子
還要把檔

21/4/2026
pm 的項目內 的有關東西 測試完
現在去做sales 跟 pm 的關係
客人看項目的位置

客人的報價單(當前版本)
staff 睇自己客人的資料


27/4/2026

暫時(應該完成了客人的部份)
現在開始處理sales


28/4/2026

sales 完成　（差看流程）
ＰＭ 完成
現在入staff 的　del bug　（完成）

明天admin

bug:
    admin:
    todolist 的crud 功能（個人）
    可自行掉配數據顯示在admin dashboard


    建立公司後 沒有立即刷新的問題

    在裝備中 應要有詳細借還log?

    客人：
    加入 該項目的單據 顯示（done)
    用戶無根申請時（不是用商品）sales 收不到申請


    sales 要做：
     每個獨立項目中的對話　做了
     單據 發送給客人顯示(應該是不用的)(客人版面是存在 所以不用發送)
     客人資料(要加入修改資料)
       - 該客人的報價單(客人版面是存在 所以不用發送)
       - 發送訊息 不要顯示(改了　是普通對話，以及項目對話　所以是要存在)
     送todo list (create)
    


sales/ChatList?projectId 不要顯是 model phase, 要顯示 model workversion ()??

Chat 系列　應該不用（之後再看流程）


     pm:
    把pm 的todo list 數據 轉去 PM dashboard 我的工作清單
     PM dashboard 導入錯誤 用了admin dashboard（done）
     todo 要做 (done)
     要做一個跟sales 的對話框（每項目) (done)

     staff:

     staff dashboard 導入錯誤 用了admin dashboard(完成)

     外借其他公司裝備不顯示 （完成）

     在不同版本中，當pm在中認同了該員工的作品後，在不同版本中的作品不見了（這可以接受，但我想留在pool 中) (done)

     可delete todo list 工作 (done)



     三系都給了新的todo curd function





30/4/2026

開發應完成（明天做run build test 以及　deploy test)


３/5/2026

報價單
收據
收到一半錢（尾款）的收據

補上



6/5/2026

應完成 補上UML


17/5/2026

done build



1/6/2026

客人的一段查詢 沒有職員對應 應該要去salse 對話(隨機的). -done (之後試是否隨機找salse) 完成
pm 的 任務表的進度bar 每次f5 都是不同 不是根據實際情況 來顯示 - done 明天試試
salse   要新增一個頁面是一般查詢(對客人) --(明天試)  完成
員工 上傳版本中 只打了備註下都可以上傳 --(明天試) 完成



17/6/2026

上git 版本


7/7/2026

增加採購的crud done (測試了 完成) 在admin 加了採購 (未試)
     - sales 的報價單 詳細示能去 （改了）
     - sales 的客人方看 報價單 （改了）
     - sales 的報價單 加了 edit 但是有點細節要做 （要可以加減 小任務）/quotations
加員工的地址(加刪除（不顯示)
pm staff sales 加入客人管理