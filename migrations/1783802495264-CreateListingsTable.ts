import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateListingsTable1783802495264 implements MigrationInterface {
    name = 'CreateListingsTable1783802495264'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."listings_category_enum" AS ENUM('FRUITS', 'VEGETABLES', 'HERBS', 'SPICES', 'LEAFY_GREENS', 'OTHER')`);
        await queryRunner.query(`CREATE TYPE "public"."listings_unit_enum" AS ENUM('kg', 'g', 'piece', 'bunch', 'litre')`);
        await queryRunner.query(`CREATE TABLE "listings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(200) NOT NULL, "description" text, "category" "public"."listings_category_enum" NOT NULL, "price" numeric(10,2) NOT NULL, "quantity" integer NOT NULL, "unit" "public"."listings_unit_enum" NOT NULL, "images" text array NOT NULL DEFAULT '{}', "supplierId" uuid NOT NULL, "latitude" numeric(9,6) NOT NULL, "longitude" numeric(9,6) NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_520ecac6c99ec90bcf5a603cdcb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "listings" ADD CONSTRAINT "FK_683bd431b0d4bcbc08cd42ce087" FOREIGN KEY ("supplierId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "listings" DROP CONSTRAINT "FK_683bd431b0d4bcbc08cd42ce087"`);
        await queryRunner.query(`DROP TABLE "listings"`);
        await queryRunner.query(`DROP TYPE "public"."listings_unit_enum"`);
        await queryRunner.query(`DROP TYPE "public"."listings_category_enum"`);
    }

}
