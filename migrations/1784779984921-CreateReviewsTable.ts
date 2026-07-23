import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateReviewsTable1784779984921 implements MigrationInterface {
    name = 'CreateReviewsTable1784779984921'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "reviews" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "orderId" uuid NOT NULL, "buyerId" uuid NOT NULL, "sellerId" uuid NOT NULL, "rating" integer NOT NULL, "comment" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_53a68dc905777554b7f702791fa" UNIQUE ("orderId"), CONSTRAINT "REL_53a68dc905777554b7f702791f" UNIQUE ("orderId"), CONSTRAINT "PK_231ae565c273ee700b283f15c1d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_53a68dc905777554b7f702791fa" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_faa909db72029375b93992b03ab" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_9805ee71aa117dee3c3f60f5271" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_9805ee71aa117dee3c3f60f5271"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_faa909db72029375b93992b03ab"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_53a68dc905777554b7f702791fa"`);
        await queryRunner.query(`DROP TABLE "reviews"`);
    }

}
